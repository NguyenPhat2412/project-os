'use client';
/**
 * EpicDialog
 * ──────────
 * Create / Edit / Delete an Epic.
 * Fields: icon, name, priority, status, startDate, dueDate, description, goals.
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { ModalShell, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ColoredToggleGroup } from '@/components/ui/colored-toggle-group';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { MarkdownEditor } from '@/components/ui/shared/markdown-editor';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { epicsCollection } from '@/modules/backlog/collections/epics';
import { improveEpicName as improveEpicNameClaude, improveEpicDescription as improveEpicDescriptionClaude, improveEpicGoals as improveEpicGoalsClaude } from '@/lib/ai/claude';
import { improveEpicName as improveEpicNameGemini, improveEpicDescription as improveEpicDescriptionGemini, improveEpicGoals as improveEpicGoalsGemini } from '@/lib/ai/gemini';
import { getActiveAIProvider } from '@/lib/ai/provider';
import { AI_LANGUAGES } from '@/lib/ai/language';
import { useAILanguage } from '@/lib/ai/useAILanguage';
import type { Epic, EpicStatus } from '@/modules/backlog/types/backlog';

type Priority = 'High' | 'Normal' | 'Low';

const PRIORITY_OPTIONS: { value: Priority; color: string }[] = [
  { value: 'High', color: 'oklch(0.577 0.245 27.325)' },
  { value: 'Normal', color: '#f59e0b' },
  { value: 'Low', color: '#22c55e' },
];

const STATUS_OPTIONS: EpicStatus[] = ['Planning', 'In Progress', 'Done', 'On Hold'];

const epicSchema = z.object({
  name: z.string().trim().min(1, 'Tên epic không được để trống'),
  icon: z.string().trim().min(1, 'Icon không được để trống'),
  priority: z.enum(['High', 'Normal', 'Low'] as const),
  status: z.enum(['Planning', 'In Progress', 'Done', 'On Hold'] as const),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  goals: z.string().optional(),
});

type EpicFormValues = z.infer<typeof epicSchema>;

interface Props {
  open: boolean;
  epic: (Epic & { id: string }) | null;
  nextId: string;
  existingEpicNames: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EpicDialog({ open, epic, nextId, existingEpicNames, onClose, onSuccess }: Props) {
  const isNew = epic === null;
  const [apiError, setApiError] = useState('');
  const [improving, setImproving] = useState<'name' | 'description' | 'goals' | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiLanguage, setAiLanguage] = useAILanguage();

  const setEpic = epicsCollection.useSet();
  const updateEpic = epicsCollection.useUpdate();
  const deleteEpic = epicsCollection.useDelete();
  const saving = setEpic.isPending || updateEpic.isPending || deleteEpic.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<EpicFormValues>({
    resolver: zodResolver(epicSchema),
    mode: 'onChange',
    defaultValues: {
      name: epic?.name ?? '',
      icon: epic?.icon ?? '📋',
      priority: epic?.priority ?? 'Normal',
      status: epic?.status ?? 'Planning',
      startDate: epic?.startDate ?? '',
      dueDate: epic?.dueDate ?? '',
      description: epic?.description ?? '',
      goals: epic?.goals ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: epic?.name ?? '',
      icon: epic?.icon ?? '📋',
      priority: epic?.priority ?? 'Normal',
      status: epic?.status ?? 'Planning',
      startDate: epic?.startDate ?? '',
      dueDate: epic?.dueDate ?? '',
      description: epic?.description ?? '',
      goals: epic?.goals ?? '',
    });
    setApiError('');
    setAiError('');
  }, [epic, reset]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleImprove = async (type: 'name' | 'description' | 'goals') => {
    setImproving(type);
    setAiError('');
    try {
      const provider = await getActiveAIProvider();
      const name = watch('name');
      // Exclude current epic name from the "existing" list to allow re-generating
      const otherNames = existingEpicNames.filter((n) => n !== epic?.name);
      if (type === 'name') {
        const result = provider === 'GEMINI' ? await improveEpicNameGemini(name, otherNames, aiLanguage) : await improveEpicNameClaude(name, otherNames, aiLanguage);
        setValue('name', result, { shouldDirty: true });
      } else if (type === 'description') {
        const current = watch('description') ?? '';
        const result = provider === 'GEMINI' ? await improveEpicDescriptionGemini(name, current, aiLanguage) : await improveEpicDescriptionClaude(name, current, aiLanguage);
        setValue('description', result, { shouldDirty: true });
      } else {
        const current = watch('goals') ?? '';
        const result = provider === 'GEMINI' ? await improveEpicGoalsGemini(name, current, aiLanguage) : await improveEpicGoalsClaude(name, current, aiLanguage);
        setValue('goals', result, { shouldDirty: true });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI improvement thất bại');
    } finally {
      setImproving(null);
    }
  };

  const onSubmit = async (data: EpicFormValues) => {
    setApiError('');
    try {
      const payload = {
        name: data.name,
        icon: data.icon,
        priority: data.priority,
        status: data.status,
        startDate: data.startDate || '',
        dueDate: data.dueDate || '',
        description: data.description || '',
        goals: data.goals || '',
        itemCount: epic?.itemCount ?? 0,
        storyPoints: epic?.storyPoints ?? 0,
        items: epic?.items ?? [],
      };
      if (isNew) {
        await setEpic.mutateAsync({ id: nextId, data: payload as never });
      } else {
        await updateEpic.mutateAsync({ id: epic.id, data: payload as never });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (isNew || !epic) return;
    setApiError('');
    try {
      await deleteEpic.mutateAsync(epic.id);
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
          heading={isNew ? 'Thêm Epic mới' : `Chỉnh sửa ${epic?.name}`}
          leading={<span className='text-[20px]'>{epic?.icon ?? '📋'}</span>}
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
                  {improving ? <span className='w-3 h-3 border-2 border-muted/30 border-t-muted rounded-full animate-spin' /> : <SparklesIcon size={13} />}
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
                <DropdownMenuItem onClick={() => handleImprove('name')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImprove('description')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Description
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImprove('goals')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Goals
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      }
      onDelete={!isNew ? handleDelete : undefined}
      deleteLabel='Xoá Epic'
      deleteDisabled={saving}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Huỷ'
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={!isValid || (!isDirty && !isNew) || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Tạo Epic' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Icon + Name */}
        <div className='grid grid-cols-[64px_1fr] gap-3'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Icon</Label>
            <Input {...register('icon')} disabled={saving} placeholder='📋' className={`text-center text-[18px] ${getFieldErrorInputClass(!!errors.icon)}`} />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Tên Epic <span className='text-red-500'>*</span>
            </Label>
            <Input {...register('name')} disabled={saving} placeholder='Quản lý sản phẩm...' className={getFieldErrorInputClass(!!errors.name)} />
            {errors.name && <span className={getInlineErrorTextClass()}>{errors.name.message}</span>}
          </div>
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
                  <SelectTrigger className='w-full h-9 text-[13px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className='text-[13px]'>
                        {s}
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
          <Controller name='description' control={control} render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} disabled={saving} placeholder='Mô tả chi tiết về epic này...' />} />
        </div>

        {/* Goals */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mục tiêu</Label>
          <Controller name='goals' control={control} render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} disabled={saving} placeholder='Kết quả mong đợi khi hoàn thành epic này...' />} />
        </div>

        {aiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{aiError}</div>}
        {apiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{apiError}</div>}
      </div>
    </ModalShell>
  );
}
