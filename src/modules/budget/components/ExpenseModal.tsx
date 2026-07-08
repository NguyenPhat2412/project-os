'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangleIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { DialogBody, ModalShell } from '@/components/ui/shared/modal-shell';
import { FormField } from '@/components/ui/form-field';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { ExpenseEntry } from '@/modules/budget/types/budget';
import type { TeamMember } from '@/modules/team/types/team';
import { getFieldErrorInputClass, getFieldErrorLabelClass, getInlineErrorTextClass } from '@/lib/form-validation';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ['Cloud', 'License', 'Marketing', 'Nhân sự', 'Đào tạo', 'Thiết bị', 'Tư vấn', 'Bảo hiểm', 'Khác'];

// ── Helpers ───────────────────────────────────────────────────────────────────
import { currentDate } from '@/lib/dayjs';
import { formatCurrencyVND } from '@/lib/numberjs';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ExpenseModalProps {
  mode: 'add' | 'edit';
  expense?: ExpenseEntry;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSave: (data: Omit<ExpenseEntry, 'id'>) => Promise<void>;
}

const expenseSchema = z.object({
  date: z.string().trim().min(1, 'Vui lòng nhập ngày.'),
  category: z.string().trim().min(1, 'Vui lòng chọn danh mục.'),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả chi tiêu.'),
  amount: z.number().gt(0, 'Số tiền phải lớn hơn 0.'),
  approverId: z.string().optional(),
  status: z.enum(['Paid', 'Pending']),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

// ── Shared input className override ──────────────────────────────────────────
const iCls = 'h-[38px] bg-secondary border-border rounded-sm text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary';

// ── Component ─────────────────────────────────────────────────────────────────
export function ExpenseModal({ mode, expense, teamMembers, onClose, onSave }: ExpenseModalProps) {
  const formId = 'expense-form';
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: expense?.date ?? currentDate(),
      category: expense?.category ?? CATEGORIES[0],
      description: expense?.description ?? '',
      amount: expense?.amount ?? 0,
      approverId: expense?.approverId ?? '',
      status: (expense?.status ?? 'Pending') as 'Paid' | 'Pending',
    },
  });
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const date = watch('date');
  const category = watch('category');
  const description = watch('description');
  const amount = Number(watch('amount') ?? 0);
  const approverId = watch('approverId');
  const status = watch('status');

  const approverMember = teamMembers.find((m) => m.id === approverId);

  const onSubmit = async (values: ExpenseFormValues) => {
    setSaving(true);
    setApiError('');
    try {
      await onSave({
        date: values.date.trim(),
        category: values.category,
        description: values.description.trim(),
        amount: Number(values.amount),
        approverId: values.approverId || undefined,
        status: values.status,
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
      maxWidth='max-w-[90vw] md:max-w-[80vw] lg:max-w-[800px]'
      title={mode === 'add' ? 'Thêm chi tiêu mới' : 'Chỉnh sửa chi tiêu'}
      icon={mode === 'add' ? <PlusIcon size={16} className='text-primary' /> : <PencilIcon size={15} className='text-primary' />}
      onCancel={onClose}
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={mode === 'add' ? 'Thêm chi tiêu' : 'Lưu thay đổi'}
      cancelLabel='Hủy'
    >
      <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className='flex flex-col min-h-0'>
        <DialogBody className='flex flex-col gap-5'>
          {/* Preview */}
          <div className='flex items-center gap-3 p-4 bg-secondary border border-border panel-inner'>
            {approverMember ? <Avatar /> : <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[12px] shrink-0'>?</div>}
            <div className='flex-1 min-w-0'>
              <div className='text-[13px] font-semibold truncate'>{description || 'Mô tả chi tiêu'}</div>
              <div className='text-[12px] text-muted-foreground mt-0.5'>
                {category} · {date}
              </div>
            </div>
            <div className='text-right shrink-0'>
              <div className='font-mono-dm text-[13px] font-bold'>{formatCurrencyVND(amount || 0)}</div>
              <div className={`text-[12px] font-semibold mt-0.5 ${status === 'Paid' ? 'text-green-500' : 'text-yellow-500'}`}>{status}</div>
            </div>
          </div>

          {/* Date + Category */}
          <div className='grid grid-cols-2 gap-3'>
            <FormField label='Ngày (dd/MM/yyyy)' className={getFieldErrorLabelClass(!!errors.date)}>
              <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.date)}`} placeholder='05/03/2026' autoFocus aria-invalid={!!errors.date} {...register('date')} />
              {errors.date?.message && <span className={getInlineErrorTextClass()}>{errors.date.message}</span>}
            </FormField>
            <FormField label='Danh mục' className={getFieldErrorLabelClass(!!errors.category)}>
              <Select value={category} onValueChange={(val) => setValue('category', val ?? CATEGORIES[0], { shouldValidate: true, shouldDirty: true })}>
                <SelectTrigger className={`w-full ${getFieldErrorInputClass(!!errors.category)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category?.message && <span className={getInlineErrorTextClass()}>{errors.category.message}</span>}
            </FormField>
          </div>

          {/* Description */}
          <FormField label='Mô tả' required className={getFieldErrorLabelClass(!!errors.description)}>
            <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.description)}`} placeholder='VD: AWS EC2 tháng 3/2026' aria-invalid={!!errors.description} {...register('description')} />
            {errors.description?.message && <span className={getInlineErrorTextClass()}>{errors.description.message}</span>}
          </FormField>

          {/* Amount + Status */}
          <div className='grid grid-cols-2 gap-3'>
            <FormField label='Số tiền (₫)' required className={getFieldErrorLabelClass(!!errors.amount)}>
              <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.amount)}`} type='number' min={1} placeholder='0' aria-invalid={!!errors.amount} {...register('amount', { setValueAs: (v) => Number(v || 0) })} />
              {errors.amount?.message && <span className={getInlineErrorTextClass()}>{errors.amount.message}</span>}
            </FormField>
            <FormField label='Trạng thái'>
              <div className='flex gap-2'>
                {(['Paid', 'Pending'] as const).map((s) => (
                  <Button
                    key={s}
                    type='button'
                    variant='outline'
                    onClick={() => setValue('status', s, { shouldValidate: true, shouldDirty: true })}
                    className={[
                      'flex-1 h-9.5 text-[12px] font-medium border transition-colors',
                      status === s
                        ? s === 'Paid'
                          ? 'bg-green-500/20 border-green-500/50 text-green-500 hover:bg-green-500/20'
                          : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20'
                        : 'bg-transparent border-border text-muted-foreground hover:border-primary/40',
                    ].join(' ')}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </FormField>
          </div>

          {/* Approver */}
          {teamMembers.length > 0 && (
            <FormField label='Người duyệt'>
              <Select value={approverId || '__none__'} onValueChange={(val) => setValue('approverId', val === '__none__' ? '' : val, { shouldDirty: true })}>
                <SelectTrigger className='w-full h-9 text-[13px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__none__' className='text-[13px]'>
                    — Chưa chọn —
                  </SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id} className='text-[13px]'>
                      {m.name} ({m.roles.join(', ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {/* Error */}
          {apiError && (
            <div className='flex items-center gap-2 bg-red-500/10 border border-red-500 rounded-sm px-3 py-2'>
              <AlertTriangleIcon size={13} className='text-red-500 shrink-0' />
              <span className='text-red-500 text-[12px]'>{apiError}</span>
            </div>
          )}
        </DialogBody>
      </form>
    </ModalShell>
  );
}
