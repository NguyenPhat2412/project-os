'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangleIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { TeamMember, WorkloadStatus } from '@/modules/team/types/team';
import { getFieldErrorInputClass, getFieldErrorLabelClass, getInlineErrorTextClass } from '@/lib/form-validation';

// ── Gradient presets ──────────────────────────────────────────────────────────
const GRADIENTS = [
  { label: 'Tím', value: 'linear-gradient(135deg,#6c63ff,#a855f7)' },
  { label: 'Xanh lá', value: 'linear-gradient(135deg,#22c55e,#16a34a)' },
  { label: 'Vàng', value: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { label: 'Hồng', value: 'linear-gradient(135deg,#ec4899,#be185d)' },
  { label: 'Lam', value: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
  { label: 'Tím đậm', value: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
  { label: 'Cam', value: 'linear-gradient(135deg,#f97316,#ea580c)' },
  { label: 'Ngọc', value: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
  { label: 'Đỏ', value: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  { label: 'Xanh dương', value: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
];

const ROLES = ['Frontend Lead', 'Backend Lead', 'Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'QA Engineer', 'DevOps Engineer', 'Business Analyst', 'Project Manager', 'Mobile Developer', 'Data Engineer', 'Security Engineer'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'XX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStatusFromWorkload(workload: number): WorkloadStatus {
  if (workload >= 90) return 'Overloaded';
  if (workload >= 75) return 'Busy';
  if (workload >= 20) return 'Active';
  return 'Vacant';
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MemberModalProps {
  mode: 'add' | 'edit';
  member?: TeamMember;
  onClose: () => void;
  onSave: (data: Omit<TeamMember, 'id'>) => Promise<void>;
}

const memberSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ và tên.'),
  email: z.string().trim().min(1, 'Vui lòng nhập email.').email('Email không hợp lệ.'),
  role: z.string().trim().min(1),
  taskCount: z.number().min(0, 'Số task không hợp lệ.').max(999, 'Số task tối đa là 999.'),
  workload: z.number().min(0).max(100),
  gradient: z.string().min(1),
});

type MemberFormValues = z.infer<typeof memberSchema>;

// ── Shared input className override ──────────────────────────────────────────
const iCls = 'h-[38px] bg-secondary border-border rounded-sm text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary';

// ── Component ─────────────────────────────────────────────────────────────────
export function MemberModal({ mode, member, onClose, onSave }: MemberModalProps) {
  const formId = 'member-form';
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: member?.name ?? '',
      email: member?.email ?? '',
      role: member?.roles?.[0] ?? ROLES[0],
      taskCount: member?.taskCount ?? 0,
      workload: member?.workload ?? 50,
      gradient: member?.gradient ?? GRADIENTS[0].value,
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    reset({
      name: member.name,
      email: member.email,
      role: member.roles?.[0],
      taskCount: member.taskCount,
      workload: member.workload,
      gradient: member.gradient,
    });
  }, [member, reset]);
  const [apiError, setApiError] = useState('');

  const name = watch('name');
  const role = watch('role');
  const workload = Number(watch('workload') ?? 0);
  const gradient = watch('gradient');

  const initials = getInitials(name || 'XX');
  const status = getStatusFromWorkload(workload);

  const statusColor = status === 'Overloaded' ? 'oklch(0.577 0.245 27.325)' : status === 'Busy' ? 'oklch(0.769 0.188 70.08)' : status === 'Active' ? 'oklch(0.646 0.222 142.116)' : 'var(--muted-foreground)';

  const workloadBarColor = workload >= 90 ? 'oklch(0.577 0.245 27.325)' : workload >= 75 ? 'oklch(0.769 0.188 70.08)' : 'oklch(0.646 0.222 142.116)';

  const onSubmit = async (values: MemberFormValues) => {
    setSaving(true);
    setApiError('');
    try {
      await onSave({
        name: values.name.trim(),
        displayName: values.name.trim(),
        email: values.email.trim(),
        roles: [values.role],
        taskCount: Number(values.taskCount),
        workload: Number(values.workload),
        gradient: values.gradient,
        initials,
        status,
      });
      onClose();
    } catch {
      setApiError('Có lỗi xảy ra, vui lòng thử lại.');
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open
      onClose={onClose}
      size='md'
      title={mode === 'add' ? 'Thêm nhân sự mới' : 'Chỉnh sửa nhân sự'}
      icon={mode === 'add' ? <PlusIcon size={16} className='text-primary' /> : <PencilIcon size={15} className='text-primary' />}
      onCancel={onClose}
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={mode === 'add' ? 'Thêm nhân sự' : 'Lưu thay đổi'}
      cancelLabel='Hủy'
    >
      <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className='p-6 flex flex-col gap-5'>
        {/* Avatar preview */}
        <div className='flex items-center gap-3 p-4 bg-secondary border border-border panel-inner'>
          <div className='w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[16px] shrink-0 ring-2 ring-white/10' style={{ background: gradient }}>
            {initials}
          </div>
          <div className='min-w-0'>
            <div className='text-[13.5px] font-semibold truncate'>{name || 'Họ tên nhân sự'}</div>
            <div className='text-[12px] flex items-center gap-2 mt-[2px]'>
              <span className='text-muted-foreground'>{role}</span>
              <span className='w-1 h-1 rounded-full bg-border' />
              <span style={{ color: statusColor }}>{status}</span>
            </div>
          </div>
        </div>

        {/* Name + Email */}
        <div className='grid grid-cols-2 gap-3'>
          <FormField label='Họ và tên' required className={getFieldErrorLabelClass(!!errors.name)}>
            <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.name)}`} placeholder='Nhập tên thành viên' autoFocus aria-invalid={!!errors.name} {...register('name')} />
            {errors.name?.message && <span className={getInlineErrorTextClass()}>{errors.name.message}</span>}
          </FormField>
          <FormField label='Email' required className={getFieldErrorLabelClass(!!errors.email)}>
            <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.email)}`} type='email' placeholder='user@company.vn' aria-invalid={!!errors.email} {...register('email')} />
            {errors.email?.message && <span className={getInlineErrorTextClass()}>{errors.email.message}</span>}
          </FormField>
        </div>

        {/* Role */}
        <FormField label='Vai trò' className={getFieldErrorLabelClass(!!errors.role)}>
          <Select value={role} onValueChange={(val) => setValue('role', val ?? ROLES[0], { shouldValidate: true, shouldDirty: true })}>
            <SelectTrigger className={`w-full h-9 text-[13px] ${getFieldErrorInputClass(!!errors.role)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className='text-[13px]'>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role?.message && <span className={getInlineErrorTextClass()}>{errors.role.message}</span>}
        </FormField>

        {/* Task count + Workload */}
        <div className='grid grid-cols-2 gap-3'>
          <FormField label='Số task đang làm' className={getFieldErrorLabelClass(!!errors.taskCount)}>
            <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.taskCount)}`} type='number' min={0} max={999} aria-invalid={!!errors.taskCount} {...register('taskCount', { setValueAs: (v) => Number(v || 0) })} />
            {errors.taskCount?.message && <span className={getInlineErrorTextClass()}>{errors.taskCount.message}</span>}
          </FormField>
          <FormField label={`Workload: ${workload}%`} className={getFieldErrorLabelClass(!!errors.workload)}>
            <div className='pt-2 pb-1'>
              <input
                type='range'
                min={0}
                max={100}
                value={workload}
                onChange={(e) => setValue('workload', Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                className='w-full h-1.5 rounded-full appearance-none cursor-pointer'
                style={{
                  background: `linear-gradient(to right, ${workloadBarColor} 0%, ${workloadBarColor} ${workload}%, var(--border) ${workload}%, var(--border) 100%)`,
                  accentColor: workloadBarColor,
                }}
              />
              <div className='flex justify-between mt-1'>
                <span className='font-mono-dm text-[9px] text-muted-foreground'>0%</span>
                <span className='font-mono-dm text-[12px] font-semibold' style={{ color: statusColor }}>
                  {status}
                </span>
                <span className='font-mono-dm text-[9px] text-muted-foreground'>100%</span>
              </div>
            </div>
            {errors.workload?.message && <span className={getInlineErrorTextClass()}>{errors.workload.message}</span>}
          </FormField>
        </div>

        {/* Gradient picker */}
        <FormField label='Màu avatar'>
          <div className='flex flex-wrap gap-[10px] pt-1'>
            {GRADIENTS.map((g) => (
              <button
                key={g.value}
                type='button'
                title={g.label}
                onClick={() => setValue('gradient', g.value, { shouldValidate: true, shouldDirty: true })}
                className='w-8 h-8 rounded-full transition-all duration-150 hover:scale-110'
                style={{
                  background: g.value,
                  outline: gradient === g.value ? '2.5px solid white' : '2.5px solid transparent',
                  outlineOffset: '2px',
                  boxShadow: gradient === g.value ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                }}
              />
            ))}
          </div>
        </FormField>

        {/* Error */}
        {apiError && (
          <div className='flex items-center gap-2 bg-red-500/10 border border-[rgba(239,68,68,0.2)] rounded-sm px-3 py-2'>
            <AlertTriangleIcon size={13} className='text-red-500 shrink-0' />
            <span className='text-red-500 text-[12px]'>{apiError}</span>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
