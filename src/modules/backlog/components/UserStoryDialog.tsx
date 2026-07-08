'use client';
/**
 * UserStoryDialog
 * ───────────────
 * Create / Edit / Delete a User Story within an Epic.
 * Mutations: update the parent Epic's items[] array via epicsCollection.useUpdate().
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { ModalShell, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColoredToggleGroup } from '@/components/ui/colored-toggle-group';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownEditor } from '@/components/ui/shared/markdown-editor';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { epicsCollection } from '@/modules/backlog/collections/epics';
import { improveStoryLabel as improveStoryLabelClaude, improveStoryDescription as improveStoryDescriptionClaude, improveStoryGoals as improveStoryGoalsClaude } from '@/lib/ai/claude';
import { improveStoryLabel as improveStoryLabelGemini, improveStoryDescription as improveStoryDescriptionGemini, improveStoryGoals as improveStoryGoalsGemini } from '@/lib/ai/gemini';
import { getActiveAIProvider } from '@/lib/ai/provider';
import { AI_LANGUAGES } from '@/lib/ai/language';
import { useAILanguage } from '@/lib/ai/useAILanguage';
import type { EpicData, EpicItem, UserStoryStatus } from '@/modules/backlog/types/backlog';
import type { TeamMember } from '@/modules/team/types/team';

type Priority = 'High' | 'Normal' | 'Low';

const PRIORITY_OPTIONS: { value: Priority; color: string }[] = [
  { value: 'High', color: 'oklch(0.577 0.245 27.325)' },
  { value: 'Normal', color: '#f59e0b' },
  { value: 'Low', color: '#22c55e' },
];

const STATUS_OPTIONS: UserStoryStatus[] = ['Todo', 'In Progress', 'Done', 'Blocked'];

const NONE = '__none__';

const triggerCls = 'w-full h-9 bg-secondary border-border text-[13px] text-foreground';
const contentCls = 'bg-card border-border text-foreground';
const itemCls = 'text-[13px] focus:bg-secondary focus:text-foreground';

const storySchema = z.object({
  label: z.string().trim().min(1, 'Nội dung không được để trống'),
  status: z.enum(['Todo', 'In Progress', 'Done', 'Blocked'] as const),
  priority: z.enum(['High', 'Normal', 'Low'] as const),
  points: z.string().optional(), // string input, coerced to number on submit
  assigneeId: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  goals: z.string().optional(),
});

type StoryFormValues = z.infer<typeof storySchema>;

interface Props {
  open: boolean;
  epic: EpicData;
  story: EpicItem | null; // null = create
  nextStoryId: string; // e.g. "US-021"
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export function UserStoryDialog({ open, epic, story, nextStoryId, teamMembers, onClose, onSuccess }: Props) {
  const isNew = story === null;
  const [apiError, setApiError] = useState('');
  const [improving, setImproving] = useState<'label' | 'description' | 'goals' | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiLanguage, setAiLanguage] = useAILanguage();

  const updateEpic = epicsCollection.useUpdate();
  const saving = updateEpic.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    mode: 'onChange',
    defaultValues: {
      label: story?.label ?? '',
      status: story?.status ?? 'Todo',
      priority: story?.priority ?? 'Normal',
      points: story?.points !== undefined ? String(story.points) : '',
      assigneeId: story?.assigneeId ?? '',
      startDate: story?.startDate ?? '',
      dueDate: story?.dueDate ?? '',
      description: story?.description ?? '',
      goals: story?.goals ?? '',
    },
  });

  useEffect(() => {
    reset({
      label: story?.label ?? '',
      status: story?.status ?? 'Todo',
      priority: story?.priority ?? 'Normal',
      points: story?.points !== undefined ? String(story.points) : '',
      assigneeId: story?.assigneeId ?? '',
      startDate: story?.startDate ?? '',
      dueDate: story?.dueDate ?? '',
      description: story?.description ?? '',
      goals: story?.goals ?? '',
    });
    setApiError('');
    setAiError('');
  }, [story, reset]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleImprove = async (type: 'label' | 'description' | 'goals') => {
    setImproving(type);
    setAiError('');
    try {
      const provider = await getActiveAIProvider();
      const label = watch('label');
      if (type === 'label') {
        const result = provider === 'GEMINI' ? await improveStoryLabelGemini(label, epic.name, aiLanguage) : await improveStoryLabelClaude(label, epic.name, aiLanguage);
        setValue('label', result, { shouldDirty: true });
      } else if (type === 'description') {
        const current = watch('description') ?? '';
        const result = provider === 'GEMINI' ? await improveStoryDescriptionGemini(label, epic.name, current, aiLanguage) : await improveStoryDescriptionClaude(label, epic.name, current, aiLanguage);
        setValue('description', result, { shouldDirty: true });
      } else {
        const current = watch('goals') ?? '';
        const result = provider === 'GEMINI' ? await improveStoryGoalsGemini(label, epic.name, current, aiLanguage) : await improveStoryGoalsClaude(label, epic.name, current, aiLanguage);
        setValue('goals', result, { shouldDirty: true });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI improvement thất bại');
    } finally {
      setImproving(null);
    }
  };

  const onSubmit = async (data: StoryFormValues) => {
    setApiError('');
    const pointsNum = data.points !== '' && data.points !== undefined ? parseInt(data.points, 10) : 0;
    const safePoints = isNaN(pointsNum) ? 0 : Math.max(0, Math.min(100, pointsNum));
    try {
      let newItems: EpicItem[];
      if (isNew) {
        const newStory: EpicItem = {
          id: nextStoryId,
          label: data.label,
          status: data.status,
          priority: data.priority,
          points: safePoints,
          assigneeId: data.assigneeId || undefined,
          startDate: data.startDate || '',
          dueDate: data.dueDate || '',
          description: data.description || '',
          goals: data.goals || '',
        };
        newItems = [...epic.items, newStory];
      } else {
        newItems = epic.items.map((i) =>
          i.id === story.id
            ? {
                ...i,
                label: data.label,
                status: data.status,
                priority: data.priority,
                points: safePoints,
                assigneeId: data.assigneeId || undefined,
                startDate: data.startDate || '',
                dueDate: data.dueDate || '',
                description: data.description || '',
                goals: data.goals || '',
              }
            : i,
        );
      }
      const storyPoints = newItems.reduce((sum, i) => sum + (i.points ?? 0), 0);
      await updateEpic.mutateAsync({
        id: epic.id,
        data: { items: newItems, itemCount: newItems.length, storyPoints } as never,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (isNew || !story) return;
    setApiError('');
    try {
      const newItems = epic.items.filter((i) => i.id !== story.id);
      const storyPoints = newItems.reduce((sum, i) => sum + (i.points ?? 0), 0);
      await updateEpic.mutateAsync({
        id: epic.id,
        data: { items: newItems, itemCount: newItems.length, storyPoints } as never,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidth='max-w-[90vw] md:max-w-[80vw] lg:max-w-[800px]'
      header={
        <ModalHeaderBar
          onClose={handleClose}
          closeDisabled={saving}
          heading={isNew ? `Thêm User Story — ${epic.name}` : 'Chỉnh sửa User Story'}
          leading={<span className='text-[20px]'>{epic.icon}</span>}
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={saving || !!improving}
                  className='h-8 gap-1.5 text-[12px] rounded-sm'
                >
                  {improving ? <span className='w-3 h-3 border-2 border-t-muted rounded-full animate-spin' /> : <SparklesIcon size={13} />}
                  {improving ? 'Đang cải thiện...' : 'Improve'}
                  <ChevronDownIcon size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-44'>
                <div className='px-2 py-1.5 flex items-center gap-1'>
                  {AI_LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type='button'
                      onClick={() => setAiLanguage(lang.value)}
                      className={`text-[12px] font-semibold px-1.5 py-0.5 rounded-sm transition-colors ${aiLanguage === lang.value ? 'bg-secondary text-foreground border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                <div className='border-t border-border my-0.5' />
                <DropdownMenuItem onClick={() => handleImprove('label')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Story
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImprove('description')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Description
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImprove('goals')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Acceptance Criteria
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      }
      onDelete={!isNew ? handleDelete : undefined}
      deleteLabel='Xoá Story'
      deleteDisabled={saving}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Huỷ'
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={!isValid || (!isDirty && !isNew) || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Thêm Story' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Label */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Nội dung <span className='text-red-500'>*</span>
          </Label>
          <Textarea {...register('label')} disabled={saving} placeholder='Là người dùng, tôi muốn...' className={`min-h-20 resize-none text-[13px] ${getFieldErrorInputClass(!!errors.label)}`} />
          {errors.label && <span className={getInlineErrorTextClass()}>{errors.label.message}</span>}
        </div>

        {/* Priority + Status */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ưu tiên</Label>
            <Controller
              name='priority'
              control={control}
              render={({ field }) => (
                <ColoredToggleGroup
                items={PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.value }))}
                value={field.value}
                onValueChange={field.onChange}
                disabled={saving}
                colorMap={Object.fromEntries(
                  PRIORITY_OPTIONS.map((p) => [
                    p.value,
                    { active: p.color, inactive: { background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'var(--border)' } },
                  ]),
                )}
              />
              )}
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Trạng thái</Label>
            <Controller
              name='status'
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                  <SelectTrigger className={triggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className={itemCls}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Story Points + Assignee */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Story Points</Label>
            <Input type='number' min={0} max={100} {...register('points')} disabled={saving} placeholder='0' className='w-24 text-[13px]' />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Người xử lý</Label>
            <Controller
              name='assigneeId'
              control={control}
              render={({ field }) => (
                <Select value={field.value || NONE} onValueChange={(val) => field.onChange(val === NONE ? '' : val)} disabled={saving}>
                  <SelectTrigger className={triggerCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={contentCls}>
                    <SelectItem value={NONE} className={itemCls}>
                      — Chưa gán —
                    </SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id} className={itemCls}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Start Date + Due Date */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày bắt đầu</Label>
            <Controller name='startDate' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} format='DD/MM/YYYY' placeholder='Chọn ngày...' />} />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày kết thúc</Label>
            <Controller name='dueDate' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} format='DD/MM/YYYY' placeholder='Chọn ngày...' />} />
          </div>
        </div>

        {/* Description */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mô tả</Label>
          <Controller name='description' control={control} render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} disabled={saving} placeholder='Mô tả chi tiết user story này...' />} />
        </div>

        {/* Goals / Acceptance Criteria */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Tiêu chí chấp nhận</Label>
          <Controller name='goals' control={control} render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} disabled={saving} placeholder='Điều kiện để story này được coi là hoàn thành...' />} />
        </div>

        {aiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{aiError}</div>}
        {apiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{apiError}</div>}
      </div>
    </ModalShell>
  );
}
