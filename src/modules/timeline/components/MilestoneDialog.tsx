'use client';
/**
 * MilestoneDialog
 * ───────────────
 * Create / Edit / Delete a Milestone.
 * Fields: name, date, status, ownerId (ref → team_members).
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { milestonesCollection } from '@/modules/timeline/collections/milestones';
import type { Milestone } from '@/modules/timeline/collections/milestones';
import type { TeamMember } from '@/modules/team/types/team';

const STATUS_OPTIONS = ['Chưa bắt đầu', 'Đang thực hiện', 'Hoàn thành'] as const;

const milestoneSchema = z.object({
  name: z.string().trim().min(1, 'Tên milestone không được để trống'),
  date: z.string().min(1, 'Ngày không được để trống'),
  status: z.enum(STATUS_OPTIONS),
  ownerId: z.string().trim().min(1, 'Owner không được để trống'),
});

type MilestoneFormValues = z.infer<typeof milestoneSchema>;

interface Props {
  open: boolean;
  milestone: (Milestone & { id: string }) | null;
  nextId: string;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export function MilestoneDialog({ open, milestone, nextId, teamMembers, onClose, onSuccess }: Props) {
  const isNew = milestone === null;
  const [apiError, setApiError] = useState('');

  const setMilestone = milestonesCollection.useSet();
  const updateMilestone = milestonesCollection.useUpdate();
  const deleteMilestone = milestonesCollection.useDelete();
  const saving = setMilestone.isPending || updateMilestone.isPending || deleteMilestone.isPending;

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    mode: 'onChange',
    defaultValues: {
      name: milestone?.name ?? '',
      date: milestone?.date ?? '',
      status: (milestone?.status as (typeof STATUS_OPTIONS)[number]) ?? 'Chưa bắt đầu',
      ownerId: milestone?.ownerId ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: milestone?.name ?? '',
      date: milestone?.date ?? '',
      status: (milestone?.status as (typeof STATUS_OPTIONS)[number]) ?? 'Chưa bắt đầu',
      ownerId: milestone?.ownerId ?? '',
    });
  }, [milestone, reset]);

  const handleClose = () => {
    if (saving) return;
    setApiError('');
    onClose();
  };

  const onSubmit = async (data: MilestoneFormValues) => {
    setApiError('');
    try {
      const payload: Omit<Milestone, 'id'> = {
        name: data.name,
        date: data.date,
        status: data.status,
        ownerId: data.ownerId,
      };
      if (isNew) {
        await setMilestone.mutateAsync({ id: nextId, data: payload as never });
      } else {
        await updateMilestone.mutateAsync({ id: milestone.id, data: payload as never });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (isNew || !milestone) return;
    setApiError('');
    try {
      await deleteMilestone.mutateAsync(milestone.id);
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
      size='sm'
      title={isNew ? 'Thêm Milestone' : 'Chỉnh sửa Milestone'}
      icon={<span className='text-[20px]'>🏁</span>}
      onDelete={!isNew ? handleDelete : undefined}
      deleteLabel='Xoá Milestone'
      deleteDisabled={saving}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Huỷ'
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={!isValid || (!isDirty && !isNew) || saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Thêm Milestone' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Name */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Tên Milestone <span className='text-red-500'>*</span>
          </Label>
          <Controller
            name='name'
            control={control}
            render={({ field }) => (
              <input
                {...field}
                disabled={saving}
                placeholder='Alpha Release (nội bộ)...'
                className={`w-full h-9 rounded-sm border border-border bg-secondary text-[13px] text-foreground px-2.5 outline-none focus:border-primary ${getFieldErrorInputClass(!!errors.name)}`}
              />
            )}
          />
          {errors.name && <span className={getInlineErrorTextClass()}>{errors.name.message}</span>}
        </div>

        {/* Date + Status */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Ngày <span className='text-red-500'>*</span>
            </Label>
            <Controller name='date' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} format='DD/MM/YYYY' disabled={saving} hasError={!!errors.date} />} />
            {errors.date && <span className={getInlineErrorTextClass()}>{errors.date.message}</span>}
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

        {/* Owner */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Owner <span className='text-red-500'>*</span>
          </Label>
          <Controller
            name='ownerId'
            control={control}
            render={({ field }) => (
              <Select value={field.value || '__none__'} onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)} disabled={saving}>
                <SelectTrigger className={`w-full h-9 text-[13px] ${getFieldErrorInputClass(!!errors.ownerId)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__none__' className='text-[13px]'>
                    — Chọn owner —
                  </SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id} className='text-[13px]'>
                      {m.name} ({m.roles?.[0] ?? m.roles?.join(', ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.ownerId && <span className={getInlineErrorTextClass()}>{errors.ownerId.message}</span>}
        </div>

        {apiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{apiError}</div>}
      </div>
    </ModalShell>
  );
}
