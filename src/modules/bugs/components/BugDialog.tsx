'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { deleteField } from '@/lib/api-rq';
import { Button } from '@/components/ui/button';
import { ColoredToggleGroup } from '@/components/ui/colored-toggle-group';
import { ModalShell, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import { DatePicker } from '@/components/ui/date-picker';
import { FileAttachmentsField, type FileAttachmentsFieldHandle } from '@/components/ui/shared/file-attachments-field';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StepsField } from '@/modules/bugs/components/StepsField';
import { MarkdownEditor } from '@/components/ui/shared/markdown-editor';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { improveBugTitle as improveBugTitleWithClaude, improveBugDescription as improveBugDescriptionWithClaude, improveBugSteps as improveBugStepsWithClaude } from '@/lib/ai/claude';
import { improveBugTitle as improveBugTitleWithGemini, improveBugDescription as improveBugDescriptionWithGemini, improveBugSteps as improveBugStepsWithGemini } from '@/lib/ai/gemini';
import { getActiveAIProvider } from '@/lib/ai/provider';
import { AI_LANGUAGES } from '@/lib/ai/language';
import { useAILanguage } from '@/lib/ai/useAILanguage';
import type { Bug, BugSeverity, BugColumn } from '@/modules/bugs/types/bug';
import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Attachment } from '@/lib/types/attachment';
import { useProject } from '@/store/project-store';
import { BUG_SEVERITY_META, BUG_SEVERITY_VALUES } from '@/lib/constants/work-item-colors';

type BugWithId = Bug & { id: string };

const SEVERITY_OPTIONS: { value: BugSeverity; color: string }[] = BUG_SEVERITY_VALUES.map((value) => ({ value, color: BUG_SEVERITY_META[value].activeColor }));

const NONE = '__none__';

const bugSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low'] as const),
  status: z.string(),
  description: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  completedAt: z.string().optional(),
  reportedAt: z.string().optional(),
  resolvedAt: z.string().optional(),
  sprintId: z.string().optional(),
});

type BugFormValues = z.infer<typeof bugSchema>;

interface Props {
  open: boolean;
  bug: BugWithId | null;
  nextId: string;
  teamMembers: TeamMember[];
  columns: BugColumn[];
  sprints: (Sprint & { id: string })[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BugDialog({ open, bug, nextId, teamMembers, columns, sprints, onClose, onSuccess }: Props) {
  const { projectId } = useProject();
  const isNew = bug === null;
  const [apiError, setApiError] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(bug?.attachments ?? []);
  const attachmentsRef = useRef<FileAttachmentsFieldHandle>(null);

  const setBug = bugsCollection.useSet();
  const updateBug = bugsCollection.useUpdate();
  const deleteBug = bugsCollection.useDelete();
  const saving = setBug.isPending || updateBug.isPending || deleteBug.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<BugFormValues>({
    resolver: zodResolver(bugSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      severity: 'Medium',
      status: columns[0]?.id ?? 'open',
      description: '',
      stepsToReproduce: '',
      assigneeId: '',
      reporterId: '',
      startDate: '',
      deadline: '',
      completedAt: '',
      reportedAt: '',
      resolvedAt: '',
      sprintId: '',
    },
  });

  const watchedStatus = watch('status');
  const [improving, setImproving] = useState<'title' | 'description' | 'steps' | null>(null);
  const [aiLanguage, setAiLanguage] = useAILanguage();

  const handleImprove = async (type: 'title' | 'description' | 'steps') => {
    setImproving(type);
    try {
      const provider = await getActiveAIProvider();
      const title = watch('title');
      if (type === 'title') {
        const result = provider === 'GEMINI' ? await improveBugTitleWithGemini(title, aiLanguage) : await improveBugTitleWithClaude(title, aiLanguage);
        setValue('title', result, { shouldDirty: true });
      } else if (type === 'description') {
        const currentDescription = watch('description') ?? '';
        const result = provider === 'GEMINI' ? await improveBugDescriptionWithGemini(title, currentDescription, aiLanguage) : await improveBugDescriptionWithClaude(title, currentDescription, aiLanguage);
        setValue('description', result, { shouldDirty: true });
      } else {
        const currentSteps = watch('stepsToReproduce') ?? '';
        const result = provider === 'GEMINI' ? await improveBugStepsWithGemini(title, currentSteps, aiLanguage) : await improveBugStepsWithClaude(title, currentSteps, aiLanguage);
        setValue('stepsToReproduce', result, { shouldDirty: true });
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'AI improvement thất bại');
    } finally {
      setImproving(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    reset({
      title: bug?.title ?? '',
      severity: bug?.severity ?? 'Medium',
      status: bug?.status ?? columns[0]?.id ?? 'open',
      description: bug?.description ?? '',
      stepsToReproduce: bug?.stepsToReproduce ?? '',
      assigneeId: bug?.assigneeId ?? '',
      reporterId: bug?.reporterId ?? '',
      startDate: bug?.startDate ?? '',
      deadline: bug?.deadline ?? '',
      completedAt: bug?.completedAt ?? '',
      reportedAt: bug?.reportedAt ?? '',
      resolvedAt: bug?.resolvedAt ?? '',
      sprintId: bug?.sprintId ?? '',
    });
    setApiError('');
    setAttachments(bug?.attachments ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bug]);

  const onSubmit = async (data: BugFormValues) => {
    setApiError('');
    try {
      const pending = isNew ? ((await attachmentsRef.current?.uploadPending()) ?? []) : [];
      const allAttachments = [...attachments, ...pending];

      if (isNew) {
        const createPayload: Record<string, unknown> = {
          title: data.title.trim(),
          severity: data.severity,
          status: data.status,
          order: Date.now(),
        };
        if (data.description?.trim()) createPayload.description = data.description.trim();
        if (data.stepsToReproduce?.trim()) createPayload.stepsToReproduce = data.stepsToReproduce.trim();
        if (data.assigneeId) createPayload.assigneeId = data.assigneeId;
        if (data.reporterId) createPayload.reporterId = data.reporterId;
        if (data.startDate) createPayload.startDate = data.startDate;
        if (data.deadline) createPayload.deadline = data.deadline;
        if (data.completedAt) createPayload.completedAt = data.completedAt;
        if (data.reportedAt) createPayload.reportedAt = data.reportedAt;
        if (data.sprintId) createPayload.sprintId = data.sprintId;
        if (allAttachments.length > 0) createPayload.attachments = allAttachments;

        await setBug.mutateAsync({ id: nextId, data: createPayload as never });
      } else {
        const updatePayload: Record<string, unknown> = {
          title: data.title.trim(),
          severity: data.severity,
          status: data.status,
          description: data.description?.trim() || deleteField(),
          stepsToReproduce: data.stepsToReproduce?.trim() || deleteField(),
          assigneeId: data.assigneeId || deleteField(),
          reporterId: data.reporterId || deleteField(),
          startDate: data.startDate || deleteField(),
          deadline: data.deadline || deleteField(),
          completedAt: data.completedAt || deleteField(),
          reportedAt: data.reportedAt || deleteField(),
          resolvedAt: data.status === 'fixed' ? data.resolvedAt || new Date().toISOString().slice(0, 10) : deleteField(),
          sprintId: data.sprintId || deleteField(),
          attachments: allAttachments.length > 0 ? allAttachments : deleteField(),
        };
        await updateBug.mutateAsync({ id: bug.id, data: updatePayload as never });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (isNew || !bug) return;
    setApiError('');
    try {
      await deleteBug.mutateAsync(bug.id);
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
      onClose={() => {
        if (!saving) onClose();
      }}
      maxWidth='max-w-[90vw] md:max-w-[80vw] lg:max-w-[800px]'
      header={
        <ModalHeaderBar
          onClose={() => {
            if (!saving) onClose();
          }}
          closeDisabled={saving}
          heading={isNew ? `Thêm Bug — ${nextId}` : `Sửa ${bug?.id}`}
          leading={<span className='text-[18px]'>🐛</span>}
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
                  {improving ? <span className='w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin' /> : <SparklesIcon size={13} />}
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
                <DropdownMenuItem onClick={() => handleImprove('title')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImprove('description')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Description
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImprove('steps')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} />
                  Improve Steps
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      }
      onDelete={!isNew ? handleDelete : undefined}
      deleteLabel='Xoá Bug'
      deleteDisabled={saving}
      onCancel={() => {
        if (!saving) onClose();
      }}
      cancelLabel='Huỷ'
      cancelDisabled={saving}
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={!isValid || (!isDirty && !isNew) || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Thêm Bug' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Title */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Tiêu đề <span className='text-red-500'>*</span>
          </Label>
          <Input {...register('title')} disabled={saving} placeholder='Mô tả ngắn gọn bug...' className={`text-[13px] ${getFieldErrorInputClass(!!errors.title)}`} />
          {errors.title && <span className={getInlineErrorTextClass()}>{errors.title.message}</span>}
        </div>

        {/* Severity + Status */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mức độ</Label>
            <Controller
              name='severity'
              control={control}
              render={({ field }) => (
                <ColoredToggleGroup
                items={SEVERITY_OPTIONS.map((s) => ({ value: s.value, label: s.value }))}
                value={field.value}
                onValueChange={field.onChange}
                disabled={saving}
                colorMap={Object.fromEntries(
                  SEVERITY_OPTIONS.map((s) => [
                    s.value,
                    { active: s.color, inactive: { background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'var(--border)' } },
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
                <Select value={field.value} onValueChange={(val) => field.onChange(val)} disabled={saving}>
                  <SelectTrigger className='w-full h-9 text-[13px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((c) => (
                      <SelectItem key={c.id} value={c.id} className='text-[13px]'>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Description */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mô tả</Label>
          <Controller name='description' control={control} render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} disabled={saving} placeholder='Mô tả chi tiết bug...' />} />
        </div>

        {/* Steps to reproduce */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Các bước tái hiện</Label>
          <Controller name='stepsToReproduce' control={control} render={({ field }) => <StepsField value={field.value ?? ''} onChange={field.onChange} disabled={saving} />} />
        </div>

        {/* Start Date + Deadline */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày bắt đầu</Label>
            <Controller name='startDate' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} format='DD/MM/YYYY' placeholder='Chọn ngày...' />} />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày hết hạn</Label>
            <Controller name='deadline' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} format='DD/MM/YYYY' placeholder='Chọn ngày...' />} />
          </div>
        </div>

        {/* Completed At + Reported At */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày hoàn thành</Label>
            <Controller name='completedAt' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} format='DD/MM/YYYY' placeholder='Chọn ngày...' />} />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày phát hiện</Label>
            <Controller name='reportedAt' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} format='DD/MM/YYYY' placeholder='Chọn ngày...' />} />
          </div>
        </div>

        {/* Resolved At — only when status = fixed */}
        {watchedStatus === 'fixed' && (
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày fix xong</Label>
            <Controller name='resolvedAt' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} format='DD/MM/YYYY' placeholder='Chọn ngày...' />} />
          </div>
        )}

        {/* Assignee + Reporter */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Người xử lý</Label>
            <Controller
              name='assigneeId'
              control={control}
              render={({ field }) => (
                <Select value={field.value || NONE} onValueChange={(val) => field.onChange(val === NONE ? '' : val)} disabled={saving}>
                  <SelectTrigger className='w-full h-9 text-[13px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE} className='text-[13px]'>
                      — Chưa gán —
                    </SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id} className='text-[13px]'>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Người nhận báo cáo</Label>
            <Controller
              name='reporterId'
              control={control}
              render={({ field }) => (
                <Select value={field.value || NONE} onValueChange={(val) => field.onChange(val === NONE ? '' : val)} disabled={saving}>
                  <SelectTrigger className='w-full h-9 text-[13px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE} className='text-[13px]'>
                      — Chưa xác định —
                    </SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id} className='text-[13px]'>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Sprint */}
        {sprints.length > 0 && (
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Sprint</Label>
            <Controller
              name='sprintId'
              control={control}
              render={({ field }) => (
                <Select value={field.value || NONE} onValueChange={(val) => field.onChange(val === NONE ? '' : val)} disabled={saving}>
                  <SelectTrigger className='w-full h-9 text-[13px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE} className='text-[13px]'>
                      — Chưa gán sprint —
                    </SelectItem>
                    {sprints.map((s) => (
                      <SelectItem key={s.id} value={s.id} className='text-[13px]'>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {/* Attachments */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Đính kèm</Label>
          <FileAttachmentsField
            ref={attachmentsRef}
            mode={isNew ? 'create' : 'edit'}
            storagePath={`projects/${projectId}/bugs/${isNew ? nextId : bug.id}/attachments`}
            attachments={attachments}
            onChange={setAttachments}
            onAutoSave={
              !isNew
                ? async (list) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await bugsCollection.helpers.update(bug.id, { attachments: list.length > 0 ? list : (deleteField() as any) });
                  }
                : undefined
            }
            disabled={saving}
          />
        </div>

        {apiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{apiError}</div>}
      </div>
    </ModalShell>
  );
}
