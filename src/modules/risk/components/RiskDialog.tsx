'use client';
/**
 * RiskDialog
 * ──────────
 * Create / Edit / Delete dialog for Risk.
 * Uses React Hook Form + Zod for validation.
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ColoredToggleGroup } from '@/components/ui/colored-toggle-group';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { risksCollection } from '@/modules/risk/collections/risks';
import type { Risk, RiskLevel } from '@/modules/risk/types/risk';
import type { TeamMember } from '@/modules/team/types/team';
import { useState } from 'react';

// ── constants ─────────────────────────────────────────────────────────────────
const LEVELS: { value: RiskLevel; color: string }[] = [
  { value: 'Critical', color: 'oklch(0.577 0.245 27.325)' },
  { value: 'High', color: '#f59e0b' },
  { value: 'Medium', color: 'var(--primary)' },
  { value: 'Low', color: '#22c55e' },
];

const STATUS_OPTIONS = ['Đang xử lý', 'Đang theo dõi', 'Đã giảm thiểu'] as const;

// ── schema ────────────────────────────────────────────────────────────────────
const riskSchema = z.object({
  level: z.enum(['Critical', 'High', 'Medium', 'Low'] as const),
  description: z.string().trim().min(1, 'Mô tả không được để trống'),
  mitigation: z.string().trim().min(1, 'Biện pháp không được để trống'),
  ownerId: z.string().trim().min(1, 'Owner không được để trống'),
  status: z.enum(['Đang xử lý', 'Đang theo dõi', 'Đã giảm thiểu'] as const),
  dueDate: z.string().optional(),
});
type RiskFormValues = z.infer<typeof riskSchema>;

// ── props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  risk: (Risk & { id: string }) | null; // null → create mode
  nextId: string; // e.g. "R-007"
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

// ── component ─────────────────────────────────────────────────────────────────
export function RiskDialog({ open, risk, nextId, teamMembers, onClose, onSuccess }: Props) {
  const isNew = risk === null;
  const [apiError, setApiError] = useState('');

  const setRisk = risksCollection.useSet();
  const updateRisk = risksCollection.useUpdate();
  const deleteRisk = risksCollection.useDelete();
  const saving = setRisk.isPending || updateRisk.isPending || deleteRisk.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema),
    mode: 'onChange',
    defaultValues: {
      level: risk?.level ?? 'Medium',
      description: risk?.description ?? '',
      mitigation: risk?.mitigation ?? '',
      ownerId: risk?.ownerId ?? '',
      status: (risk?.status as RiskFormValues['status']) ?? 'Đang theo dõi',
      dueDate: risk?.dueDate ?? '',
    },
  });

  useEffect(() => {
    reset({
      level: risk?.level ?? 'Medium',
      description: risk?.description ?? '',
      mitigation: risk?.mitigation ?? '',
      ownerId: risk?.ownerId ?? '',
      status: (risk?.status as RiskFormValues['status']) ?? 'Đang theo dõi',
      dueDate: risk?.dueDate ?? '',
    });
  }, [risk, reset]);

  const handleClose = () => {
    if (saving) return;
    setApiError('');
    onClose();
  };

  const onSubmit = async (data: RiskFormValues) => {
    setApiError('');
    try {
      const payload: Omit<Risk, 'id'> = {
        level: data.level,
        description: data.description.trim(),
        mitigation: data.mitigation.trim(),
        ownerId: data.ownerId,
        status: data.status,
        ...(data.dueDate?.trim() ? { dueDate: data.dueDate.trim() } : {}),
      };

      if (isNew) {
        await setRisk.mutateAsync({ id: nextId, data: payload as never });
      } else {
        await updateRisk.mutateAsync({ id: risk.id, data: payload as never });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (isNew || !risk) return;
    setApiError('');
    try {
      await deleteRisk.mutateAsync(risk.id);
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
      title={isNew ? 'Thêm rủi ro mới' : 'Chỉnh sửa rủi ro'}
      icon={<span className='text-[20px]'>⚠️</span>}
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
      submitLabel={isNew ? 'Thêm rủi ro' : 'Lưu thay đổi'}
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Level */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Mức độ</Label>
          <Controller
            name='level'
            control={control}
            render={({ field }) => (
              <ColoredToggleGroup
                items={LEVELS.map((l) => ({ value: l.value, label: l.value }))}
                value={field.value}
                onValueChange={field.onChange}
                disabled={saving}
                colorMap={Object.fromEntries(
                  LEVELS.map((l) => [
                    l.value,
                    { active: l.color, inactive: { background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'var(--border)' } },
                  ]),
                )}
              />
              )}
            />
        </div>

        {/* Description */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Mô tả rủi ro <span className='text-red-500'>*</span>
          </Label>
          <Textarea {...register('description')} disabled={saving} placeholder='Mô tả chi tiết rủi ro...' className={`min-h-18 resize-none text-[13px] ${getFieldErrorInputClass(!!errors.description)}`} />
          {errors.description && <span className={getInlineErrorTextClass()}>{errors.description.message}</span>}
        </div>

        {/* Mitigation */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>
            Biện pháp giảm thiểu <span className='text-red-500'>*</span>
          </Label>
          <Textarea {...register('mitigation')} disabled={saving} placeholder='Mô tả biện pháp xử lý...' className={`min-h-18 resize-none text-[13px] ${getFieldErrorInputClass(!!errors.mitigation)}`} />
          {errors.mitigation && <span className={getInlineErrorTextClass()}>{errors.mitigation.message}</span>}
        </div>

        {/* Owner + Status row */}
        <div className='grid grid-cols-2 gap-3'>
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

        {/* Due Date */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Ngày hết hạn</Label>
          <Controller name='dueDate' control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} format='DD/MM/YYYY' disabled={saving} />} />
        </div>

        {/* API error */}
        {apiError && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{apiError}</div>}
      </div>
    </ModalShell>
  );
}
