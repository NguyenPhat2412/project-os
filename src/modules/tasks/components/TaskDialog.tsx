'use client';
/**
 * TaskDialog
 * ──────────
 * Create / Edit dialog for Tasks.
 * Uses React Hook Form + Zod for validation.
 * Required fields: title, priority, status.
 * Optional: description, deadline, points, assignee.
 * All mutations use api-rq hooks (tasksCollection).
 */

import { ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { FileAttachmentsField, FileAttachmentsFieldHandle } from '@/components/ui/shared/file-attachments-field';
import { MarkdownEditor } from '@/components/ui/shared/markdown-editor';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ModalHeaderBar, ModalShell } from '@/components/ui/shared/modal-shell';
import { Button } from '@/components/ui/button';
import { ColoredToggleGroup } from '@/components/ui/colored-toggle-group';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { improveTaskDescription as improveTaskDescriptionWithClaude, improveTaskTitle as improveTaskTitleWithClaude } from '@/lib/ai/claude';
import { improveTaskDescription as improveTaskDescriptionWithGemini, improveTaskTitle as improveTaskTitleWithGemini } from '@/lib/ai/gemini';
import { AI_LANGUAGES } from '@/lib/ai/language';
import { getActiveAIProvider } from '@/lib/ai/provider';
import { useAILanguage } from '@/lib/ai/useAILanguage';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { useProject } from '@/store/project-store';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { DEFAULT_TASK_COLUMNS } from '@/modules/tasks/utils/taskColumns';
import { zodResolver } from '@hookform/resolvers/zod';

import type { Priority, TaskColumn } from '@/modules/tasks/types/task';
import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Attachment } from '@/lib/types/attachment';

// ── helpers ───────────────────────────────────────────────────────────────────
const roleLabel = (roles?: string[]) => roles?.[0] ?? roles?.join(', ');

function MemberSelectItem({ member }: { member: TeamMember }) {
  return (
    <SelectItem key={member.id} value={member.id} className='text-[13px]'>
      <span className='flex items-center gap-2'>
        <UserAvatar user={member} size='sm' />
        <span>{member.displayName} ({roleLabel(member.roles)})</span>
      </span>
    </SelectItem>
  );
}

function formatDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── schema ────────────────────────────────────────────────────────────────────
const taskSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống'),
  priority: z.enum(['High', 'Normal', 'Low'] as const),
  status: z.string().trim().min(1, 'Trạng thái không được để trống'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  startDate: z.string().optional(),
  completedAt: z.string().optional(),
  points: z.string().optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  sprintId: z.string().optional(),
});
type TaskFormValues = z.infer<typeof taskSchema>;

// ── constants ─────────────────────────────────────────────────────────────────
const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'High', label: 'High', color: 'oklch(0.577 0.245 27.325)' },
  { value: 'Normal', label: 'Normal', color: 'oklch(0.769 0.188 70.08)' },
  { value: 'Low', label: 'Low', color: 'oklch(0.646 0.222 142.116)' },
];

const NONE = '__none__';

// ── props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  task: {
    id: string;
    title: string;
    priority: Priority;
    status: string;
    description?: string;
    deadline?: string;
    startDate?: string;
    completedAt?: string;
    points?: number;
    assigneeId?: string;
    reporterId?: string;
    sprintId?: string;
    attachments?: Attachment[];
  } | null;
  nextTaskIndex: number;
  teamMembers: TeamMember[];
  statusOptions: TaskColumn[];
  sprints?: (Sprint & { id: string })[];
  defaultStatus?: string;
  defaultSprintId?: string;
  onClose: () => void;
  onSuccess: () => void;
  onCreateTask?: (id: string, data: Record<string, unknown>) => Promise<unknown>;
}

// ── component ─────────────────────────────────────────────────────────────────
export function TaskDialog({ open, task, nextTaskIndex, teamMembers, statusOptions, sprints = [], defaultStatus = DEFAULT_TASK_COLUMNS[0]?.id ?? '', defaultSprintId, onClose, onSuccess, onCreateTask }: Props) {
  const { projectId } = useProject();
  const isNew = task === null;

  // ── api-rq mutations ─────────────────────────────────────────────────
  const createTask = tasksCollection.useSet();
  const updateTask = tasksCollection.useUpdate();
  const deleteTask = tasksCollection.useDelete();
  const [customSaving, setCustomSaving] = useState(false);

  const saving = customSaving || createTask.isPending || updateTask.isPending || deleteTask.isPending;
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments ?? []);
  const attachmentsRef = useRef<FileAttachmentsFieldHandle>(null);
  const resolvedStatusOptions = statusOptions.length > 0 ? statusOptions : DEFAULT_TASK_COLUMNS;

  const resolveInitialStatus = () => {
    if (task?.status) return task.status;
    if (resolvedStatusOptions.some((option) => option.id === defaultStatus)) return defaultStatus;
    return resolvedStatusOptions[0]?.id ?? '';
  };

  const [improving, setImproving] = useState<'title' | 'description' | null>(null);
  const [aiError, setAiError] = useState('');
  const [aiLanguage, setAiLanguage] = useAILanguage();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
    defaultValues: {
      title: task?.title ?? '',
      priority: task?.priority ?? 'Normal',
      status: resolveInitialStatus(),
      description: task?.description ?? '',
      deadline: task?.deadline ?? '',
      startDate: task?.startDate ?? '',
      completedAt: task?.completedAt ?? '',
      points: task?.points !== undefined ? String(task.points) : '',
      assigneeId: task?.assigneeId ?? '',
      reporterId: task?.reporterId ?? '',
      sprintId: task?.sprintId ?? defaultSprintId ?? '',
    },
  });

  // Reset form when dialog opens or task changes
  useEffect(() => {
    if (!open) return;
    reset({
      title: task?.title ?? '',
      priority: task?.priority ?? 'Normal',
      status: resolveInitialStatus(),
      description: task?.description ?? '',
      deadline: task?.deadline ?? '',
      startDate: task?.startDate ?? '',
      completedAt: task?.completedAt ?? '',
      points: task?.points !== undefined ? String(task.points) : '',
      assigneeId: task?.assigneeId ?? '',
      reporterId: task?.reporterId ?? '',
      sprintId: task?.sprintId ?? defaultSprintId ?? '',
    });
    setAttachments(task?.attachments ?? []);
  }, [open, task, defaultStatus, defaultSprintId, reset, statusOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImprove = async (type: 'title' | 'description') => {
    setImproving(type);
    setAiError('');
    try {
      const provider = await getActiveAIProvider();
      const title = watch('title');
      if (type === 'title') {
        const result = provider === 'GEMINI' ? await improveTaskTitleWithGemini(title, aiLanguage) : await improveTaskTitleWithClaude(title, aiLanguage);
        setValue('title', result, { shouldDirty: true });
      } else {
        const currentDescription = watch('description') ?? '';
        const result = provider === 'GEMINI' ? await improveTaskDescriptionWithGemini(title, currentDescription, aiLanguage) : await improveTaskDescriptionWithClaude(title, currentDescription, aiLanguage);
        setValue('description', result, { shouldDirty: true });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI improvement thất bại');
    } finally {
      setImproving(null);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const onSubmit = async (data: TaskFormValues) => {
    const pointsNum = data.points !== '' && data.points !== undefined ? parseInt(data.points, 10) : NaN;

    if (isNew) {
      const newId = `TASK-${String(nextTaskIndex).padStart(2, '0')}`;
      const pending = (await attachmentsRef.current?.uploadPending()) ?? [];
      const allAttachments = [...attachments, ...pending];

      const createPayload = {
        id: newId,
        title: data.title.trim(),
        priority: data.priority,
        status: data.status,
        createdAt: formatDate(new Date()),
        order: nextTaskIndex - 1,
        description: data.description?.trim() || undefined,
        deadline: data.deadline || undefined,
        startDate: data.startDate || undefined,
        completedAt: data.completedAt || undefined,
        points: !isNaN(pointsNum) ? pointsNum : undefined,
        assigneeId: data.assigneeId || undefined,
        reporterId: data.reporterId || undefined,
        sprintId: data.sprintId || undefined,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
      };

      if (onCreateTask) {
        setCustomSaving(true);
        try {
          await onCreateTask(newId, createPayload);
        } finally {
          setCustomSaving(false);
        }
      } else {
        await createTask.mutateAsync({ id: newId, data: createPayload as never });
      }
    } else {
      const updatePayload = {
        title: data.title.trim(),
        priority: data.priority,
        status: data.status,
        // PATCH removes fields only when they are sent as null. Sending
        // undefined omits them from JSON and leaves the old server value.
        description: data.description?.trim() || null,
        deadline: data.deadline || null,
        startDate: data.startDate || null,
        completedAt: data.completedAt || null,
        points: !isNaN(pointsNum) ? pointsNum : null,
        assigneeId: data.assigneeId || null,
        reporterId: data.reporterId || null,
        sprintId: data.sprintId || null,
        attachments: attachments.length > 0 ? attachments : null,
      };
      await updateTask.mutateAsync({ id: task.id, data: updatePayload as never });
    }

    onSuccess();
    onClose();
  };

  const handleDelete = async () => {
    if (isNew || !task) return;
    await deleteTask.mutateAsync(task.id);
    onSuccess();
    onClose();
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
          heading={isNew ? 'Tạo Task mới' : 'Chỉnh sửa Task'}
          leading={<span className='text-[20px]'>✅</span>}
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type='button' variant='outline' size='sm' disabled={saving || !!improving} className='h-8 gap-1.5 text-[12px] rounded-sm'>
                  {improving ? <span className='w-3 h-3 border-2 border-muted/30 border-t-muted-foreground rounded-full animate-spin' /> : <SparklesIcon size={13} />}
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
                  <SparklesIcon size={13} className='text-purple-500' />
                  Improve Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImprove('description')} disabled={!!improving} className='text-[13px] gap-2 focus:bg-secondary cursor-pointer'>
                  <SparklesIcon size={13} className='text-purple-500' />
                  Improve Description
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      }
      onDelete={!isNew ? handleDelete : undefined}
      deleteLabel='Xoá'
      deleteDisabled={saving}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Huỷ'
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={!isValid || (!isDirty && !isNew) || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Tạo Task' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Title */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Tiêu đề <span className='text-red-500'>*</span>
          </Label>
          <Input {...register('title')} disabled={saving} placeholder='Nhập tiêu đề task...' className={getFieldErrorInputClass(!!errors.title)} />
          {errors.title && <span className={getInlineErrorTextClass()}>{errors.title.message}</span>}
        </div>

        {/* Priority + Status row */}
        <div className='grid grid-cols-2 gap-3'>
          {/* Priority */}
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ưu tiên</Label>
            <Controller
              name='priority'
              control={control}
              render={({ field }) => (
                <ColoredToggleGroup
                  items={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={saving}
                  colorMap={Object.fromEntries(PRIORITIES.map((p) => [p.value, { active: p.color, inactive: { background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'var(--border)' } }]))}
                />
              )}
            />
          </div>

          {/* Status */}
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
                  <SelectContent className=''>
                    {resolvedStatusOptions.map((status) => (
                      <SelectItem key={status.id} value={status.id} className='text-[13px]'>
                        {status.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Start Date + Deadline row */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày bắt đầu</Label>
            <Controller name='startDate' control={control} render={({ field }) => <DateTimePicker value={field.value} onChange={field.onChange} disabled={saving} />} />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày hết hạn</Label>
            <Controller name='deadline' control={control} render={({ field }) => <DateTimePicker value={field.value} onChange={field.onChange} disabled={saving} hasError={!!errors.deadline} />} />
          </div>
        </div>

        {/* Completed At + Points row */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày hoàn thành</Label>
            <Controller name='completedAt' control={control} render={({ field }) => <DateTimePicker value={field.value} onChange={field.onChange} disabled={saving} />} />
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Story Points</Label>
            <Input {...register('points')} type='number' min={0} disabled={saving} placeholder='0' className='text-[13px]' />
          </div>
        </div>

        {/* Assignee + Reporter */}
        {teamMembers.length > 0 && (
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Người thực hiện</Label>
              <Controller
                name='assigneeId'
                control={control}
                render={({ field }) => (
                  <Select value={field.value || NONE} onValueChange={(val) => field.onChange(val === NONE ? '' : val)} disabled={saving}>
                    <SelectTrigger className='w-full h-9 text-[13px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className=''>
                      <SelectItem value={NONE} className='text-[13px]'>
                        — Chưa giao —
                      </SelectItem>
                      {teamMembers.map((m) => (
                        <MemberSelectItem key={m.id} member={m} />
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
                    <SelectContent className=''>
                      <SelectItem value={NONE} className='text-[13px]'>
                        — Chưa xác định —
                      </SelectItem>
                      {teamMembers.map((m) => (
                        <MemberSelectItem key={m.id} member={m} />
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        )}

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
                  <SelectContent className=''>
                    <SelectItem value={NONE} className='text-[13px]'>
                      — Không thuộc sprint —
                    </SelectItem>
                    {sprints.map((s) => (
                      <SelectItem key={s.id} value={s.id} className='text-[13px]'>
                        {s.name} ({s.status})
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
            storagePath={`projects/${projectId}/tasks/${isNew ? `TASK-${String(nextTaskIndex).padStart(2, '0')}` : task.id}/attachments`}
            attachments={attachments}
            onChange={setAttachments}
            onAutoSave={
              !isNew && task
                ? async (list) => {
                    await updateTask.mutateAsync({ id: task.id, data: { attachments: list.length > 0 ? list : undefined } as never });
                  }
                : undefined
            }
            disabled={saving}
          />
        </div>
        {/* Description */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mô tả</Label>
          <Controller name='description' control={control} render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} disabled={saving} placeholder='Mô tả chi tiết task...' />} />
        </div>
        {/* API error */}
        {(aiError || createTask.isError || updateTask.isError || deleteTask.isError) && (
          <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{aiError || createTask.error?.message || updateTask.error?.message || deleteTask.error?.message || 'Đã xảy ra lỗi'}</div>
        )}
      </div>
    </ModalShell>
  );
}
