'use client';
/**
 * MeetingDialog
 * ─────────────
 * Create / Edit / Delete a meeting.
 * Fields: title, date, time, location, description, important, attendeeIds, attachments.
 * Uses DatePicker (shadcn), TimePicker, FileAttachmentsField.
 */

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { FileAttachmentsField, type FileAttachmentsFieldHandle } from '@/components/ui/shared/file-attachments-field';
import { useProject } from '@/store/project-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { meetingsCollection } from '@/modules/meetings/collections/meetings';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';
import type { Attachment } from '@/lib/types/attachment';

const meetingSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống'),
  date: z.string().trim().min(1, 'Ngày không được để trống'),
  time: z.string().trim().min(1, 'Thời gian không được để trống'),
  location: z.string().trim().min(1, 'Địa điểm không được để trống'),
  description: z.string().optional(),
  important: z.boolean(),
  attendeeIds: z.array(z.string()),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface Props {
  open: boolean;
  meeting: (Meeting & { id: string }) | null;
  nextId: string;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

export function MeetingDialog({ open, meeting, nextId, teamMembers, onClose, onSuccess }: Props) {
  const { projectId } = useProject();
  const isNew = meeting === null;
  const [apiError, setApiError] = useState('');
  const attachmentRef = useRef<FileAttachmentsFieldHandle>(null);

  const createMeeting = meetingsCollection.useCreate();
  const updateMeeting = meetingsCollection.useUpdate();
  const deleteMeeting = meetingsCollection.useDelete();
  const saving = createMeeting.isPending || updateMeeting.isPending || deleteMeeting.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    mode: 'onChange',
    defaultValues: {
      title: meeting?.title ?? '',
      date: meeting?.date ?? '',
      time: meeting?.time ?? '',
      location: meeting?.location ?? '',
      description: meeting?.description ?? '',
      important: meeting?.important ?? false,
      attendeeIds: meeting?.attendeeIds ?? [],
    },
  });

  useEffect(() => {
    reset({
      title: meeting?.title ?? '',
      date: meeting?.date ?? '',
      time: meeting?.time ?? '',
      location: meeting?.location ?? '',
      description: meeting?.description ?? '',
      important: meeting?.important ?? false,
      attendeeIds: meeting?.attendeeIds ?? [],
    });
    setApiError('');
  }, [meeting, reset]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const selectedIds = watch('attendeeIds');

  const toggleAttendee = (memberId: string) => {
    const next = selectedIds.includes(memberId) ? selectedIds.filter((id) => id !== memberId) : [...selectedIds, memberId];
    setValue('attendeeIds', next, { shouldDirty: true });
  };

  const onSubmit = async (data: MeetingFormValues) => {
    setApiError('');
    try {
      // Parse date into day/month for storage
      const [d, m, y] = data.date.split('/');
      const monthIndex = parseInt(m, 10) - 1;

      // Upload pending attachments (only in create mode)
      let savedAttachments: Attachment[] = [];
      if (isNew) {
        savedAttachments = (await attachmentRef.current?.uploadPending()) ?? [];
      }

      const payload = {
        title: data.title,
        date: data.date,
        day: parseInt(d, 10),
        month: MONTHS[monthIndex] ?? 'JAN',
        year: parseInt(y, 10),
        time: data.time,
        location: data.location,
        description: data.description ?? '',
        important: data.important,
        attendeeIds: data.attendeeIds,
        attachments: savedAttachments,
      };

      if (isNew) {
        await createMeeting.mutateAsync({ ...payload, id: nextId } as never);
      } else {
        await updateMeeting.mutateAsync({ id: meeting.id, data: payload as never });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (isNew || !meeting) return;
    setApiError('');
    try {
      await deleteMeeting.mutateAsync(meeting.id);
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
      size='md'
      title={isNew ? 'Thêm cuộc họp' : 'Chỉnh sửa cuộc họp'}
      icon={<span className='text-[20px]'>📅</span>}
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
      submitLabel={isNew ? 'Thêm' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Title */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Tiêu đề <span className='text-red-500'>*</span>
          </Label>
          <Input {...register('title')} disabled={saving} placeholder='Sprint Planning S-09...' className={getFieldErrorInputClass(!!errors.title)} />
          {errors.title && <span className={getInlineErrorTextClass()}>{errors.title.message}</span>}
        </div>

        {/* Date + Time */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Ngày <span className='text-red-500'>*</span>
            </Label>
            <Controller name='date' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={saving} placeholder='DD/MM/YYYY' hasError={!!errors.date} />} />
            {errors.date && <span className={getInlineErrorTextClass()}>{errors.date.message}</span>}
          </div>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
              Thời gian <span className='text-red-500'>*</span>
            </Label>
            <Controller name='time' control={control} render={({ field }) => <TimePicker value={field.value} onChange={field.onChange} disabled={saving} placeholder='HH:mm' />} />
            {errors.time && <span className={getInlineErrorTextClass()}>{errors.time.message}</span>}
          </div>
        </div>

        {/* Location */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Địa điểm <span className='text-red-500'>*</span>
          </Label>
          <Input {...register('location')} disabled={saving} placeholder='Google Meet / Phòng A2...' className={getFieldErrorInputClass(!!errors.location)} />
          {errors.location && <span className={getInlineErrorTextClass()}>{errors.location.message}</span>}
        </div>

        {/* Description */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mô tả</Label>
          <Textarea {...register('description')} disabled={saving} placeholder='Nội dung cuộc họp, chương trình nghị sự...' rows={3} className='resize-none text-[13px] bg-secondary border-border text-foreground placeholder:text-muted-foreground' />
        </div>

        {/* Attachments — FileAttachmentsField manages its own state */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Tệp đính kèm</Label>
          <FileAttachmentsField
            ref={attachmentRef}
            mode={isNew ? 'create' : 'edit'}
            storagePath={`projects/${projectId}/meetings/${isNew ? nextId : meeting?.id}/attachments`}
            attachments={meeting?.attachments ?? []}
            onChange={() => {}}
            onAutoSave={
              !isNew
                ? async (attachments: Attachment[]) => {
                    await updateMeeting.mutateAsync({ id: meeting!.id, data: { attachments } as never });
                  }
                : undefined
            }
            disabled={saving}
          />
        </div>

        {/* Attendees */}
        {teamMembers.length > 0 && (
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Người tham dự</Label>
            <Controller
              name='attendeeIds'
              control={control}
              render={() => (
                <div className='flex flex-wrap gap-2'>
                  {teamMembers.map((m) => {
                    const selected = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type='button'
                        disabled={saving}
                        onClick={() => toggleAttendee(m.id)}
                        className='flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[12px] transition-colors'
                        style={
                          selected
                            ? { background: 'color-mix(in oklch, var(--primary) 12%, transparent)', borderColor: 'var(--primary)', color: 'var(--primary)' }
                            : { background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                        }
                      >
                        <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
        )}

        {/* Important */}
        <div className='flex items-center gap-2'>
          <input id='important' type='checkbox' {...register('important')} disabled={saving} className='w-4 h-4 rounded border-border accent-primary' />
          <Label htmlFor='important' className='text-[13px] cursor-pointer'>
            Đánh dấu quan trọng
          </Label>
        </div>

        {apiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{apiError}</div>}
      </div>
    </ModalShell>
  );
}
