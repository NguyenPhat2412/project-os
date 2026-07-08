'use client';
/**
 * SprintDialog
 * ────────────
 * Create / Edit / Delete sprint.
 * Fields: name, startDate, endDate, goal, status.
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { DatePicker } from '@/components/ui/date-picker';
import { sprintsCollection } from '@/modules/sprint/collections/sprint';
import type { Sprint, SprintStatus } from '@/modules/sprint/types/sprint';

// ── schema ────────────────────────────────────────────────────────────────────
const sprintSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên sprint không được để trống'),
    startDate: z.string().min(1, 'Ngày bắt đầu không được để trống'),
    endDate: z.string().min(1, 'Ngày kết thúc không được để trống'),
    goal: z.string().trim().min(1, 'Sprint goal không được để trống'),
    status: z.enum(['planned', 'active', 'completed'] as const),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  });

type SprintFormValues = z.infer<typeof sprintSchema>;

const STATUS_OPTIONS: { value: SprintStatus; label: string }[] = [
  { value: 'planned', label: 'Planned — chưa bắt đầu' },
  { value: 'active', label: 'Active — đang chạy' },
  { value: 'completed', label: 'Completed — đã xong' },
];

// ── props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  sprint: (Sprint & { id: string }) | null;
  nextOrder: number;
  onClose: () => void;
  onSuccess: () => void;
}

// ── component ─────────────────────────────────────────────────────────────────
export function SprintDialog({ open, sprint, nextOrder, onClose, onSuccess }: Props) {
  const isNew = sprint === null;
  const [apiError, setApiError] = useState('');

  // ── Mutation hooks — auto-invalidate React Query cache on success ──────────
  const setMutation = sprintsCollection.useSet();
  const updateMutation = sprintsCollection.useUpdate();
  const deleteMutation = sprintsCollection.useDelete();
  const saving = setMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<SprintFormValues>({
    resolver: zodResolver(sprintSchema),
    mode: 'onChange',
    defaultValues: {
      name: sprint?.name ?? `Sprint ${String(nextOrder).padStart(2, '0')}`,
      startDate: sprint?.startDate ?? '',
      endDate: sprint?.endDate ?? '',
      goal: sprint?.goal ?? '',
      status: sprint?.status ?? 'planned',
    },
  });

  useEffect(() => {
    reset({
      name: sprint?.name ?? `Sprint ${String(nextOrder).padStart(2, '0')}`,
      startDate: sprint?.startDate ?? '',
      endDate: sprint?.endDate ?? '',
      goal: sprint?.goal ?? '',
      status: sprint?.status ?? 'planned',
    });
    setApiError('');
  }, [sprint, nextOrder, reset]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const onSubmit = (data: SprintFormValues) => {
    setApiError('');
    const payload = {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      goal: data.goal,
      status: data.status,
    };

    if (isNew) {
      const id = `SPRINT-${String(nextOrder).padStart(2, '0')}`;
      setMutation.mutate(
        { id, data: { ...payload, order: nextOrder } as never },
        {
          onSuccess: () => {
            onSuccess();
            onClose();
          },
          onError: (err) => setApiError(err instanceof Error ? err.message : String(err)),
        },
      );
    } else {
      updateMutation.mutate(
        { id: sprint.id, data: payload as never },
        {
          onSuccess: () => {
            onSuccess();
            onClose();
          },
          onError: (err) => setApiError(err instanceof Error ? err.message : String(err)),
        },
      );
    }
  };

  const handleDelete = () => {
    if (isNew || !sprint) return;
    deleteMutation.mutate(sprint.id, {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (err) => setApiError(err instanceof Error ? err.message : String(err)),
    });
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      size='sm'
      title={isNew ? 'Tạo Sprint mới' : `Chỉnh sửa ${sprint?.name}`}
      icon={<span className='text-[20px]'>🏃</span>}
      onDelete={!isNew ? handleDelete : undefined}
      deleteLabel='Xoá Sprint'
      deleteDisabled={saving}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Huỷ'
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={!isValid || (!isDirty && !isNew) || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Tạo Sprint' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Name */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Tên Sprint <span className='text-red-500'>*</span>
          </Label>
          <Input {...register('name')} disabled={saving} placeholder='Sprint 09' className={getFieldErrorInputClass(!!errors.name)} />
          {errors.name && <span className={getInlineErrorTextClass()}>{errors.name.message}</span>}
        </div>

        {/* Dates */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Bắt đầu <span className='text-red-500'>*</span>
            </Label>
            <Controller name='startDate' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} format='YYYY-MM-DD' disabled={saving} hasError={!!errors.startDate} />} />
            {errors.startDate && <span className={getInlineErrorTextClass()}>{errors.startDate.message}</span>}
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Kết thúc <span className='text-red-500'>*</span>
            </Label>
            <Controller name='endDate' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} format='YYYY-MM-DD' disabled={saving} hasError={!!errors.endDate} />} />
            {errors.endDate && <span className={getInlineErrorTextClass()}>{errors.endDate.message}</span>}
          </div>
        </div>

        {/* Status */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Trạng thái</Label>
          <Controller
            name='status'
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={(val) => field.onChange(val as SprintStatus)} disabled={saving}>
                <SelectTrigger className='w-full h-9 text-[13px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className='text-[13px]'>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Goal */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Sprint Goal <span className='text-red-500'>*</span>
          </Label>
          <Textarea {...register('goal')} disabled={saving} placeholder='Mục tiêu cần đạt được trong sprint này...' className={`min-h-18 resize-none text-[13px] ${getFieldErrorInputClass(!!errors.goal)}`} />
          {errors.goal && <span className={getInlineErrorTextClass()}>{errors.goal.message}</span>}
        </div>

        {apiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{apiError}</div>}
      </div>
    </ModalShell>
  );
}
