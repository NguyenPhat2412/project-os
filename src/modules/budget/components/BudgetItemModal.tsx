'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangleIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { DialogBody, ModalShell } from '@/components/ui/shared/modal-shell';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { BudgetItem } from '@/modules/budget/types/budget';
import { getFieldErrorInputClass, getFieldErrorLabelClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { formatCurrencyVND } from '@/lib/numberjs';

// ── Constants ──────────────────────────────────────────────────────────────────
const ICON_OPTIONS = ['👥', '💻', '☁️', '📣', '📚', '🔧', '🏗️', '📊', '💡', '🔌', '🎨', '📦', '🛡️', '💬', '🚀'];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BudgetItemModalProps {
  mode: 'add' | 'edit';
  item?: BudgetItem;
  onClose: () => void;
  onSave: (data: Omit<BudgetItem, 'id'>) => Promise<void>;
}

const budgetItemSchema = z.object({
  icon: z.string().min(1),
  category: z.string().trim().min(1, 'Vui lòng nhập tên hạng mục.'),
  spent: z.number().min(0, 'Đã chi không hợp lệ.'),
  budget: z
    .number()
    .refine((v) => !Number.isNaN(v), 'Vui lòng nhập ngân sách.')
    .gt(0, 'Ngân sách phải lớn hơn 0.'),
});

type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;

// ── Shared input className override ──────────────────────────────────────────
const iCls = 'h-[38px] bg-secondary border-border rounded-sm text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary';

// ── Component ─────────────────────────────────────────────────────────────────
export function BudgetItemModal({ mode, item, onClose, onSave }: BudgetItemModalProps) {
  const formId = 'budget-item-form';
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<BudgetItemFormValues>({
    resolver: zodResolver(budgetItemSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      icon: item?.icon ?? '💡',
      category: item?.category ?? '',
      spent: item?.spent ?? 0,
      budget: item?.budget ?? 0,
    },
  });
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const icon = watch('icon');
  const category = watch('category');
  const spent = Number(watch('spent') ?? 0);
  const budget = Number(watch('budget') ?? 0);

  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const overBudget = spent > budget && budget > 0;
  const barColor = overBudget || pct >= 85 ? 'oklch(0.577 0.245 27.325)' : 'var(--primary)';

  const onSubmit = async (values: BudgetItemFormValues) => {
    const normalizedCategory = values.category?.trim() ?? '';
    if (!normalizedCategory) {
      setError('category', { type: 'manual', message: 'Vui lòng nhập tên hạng mục.' });
      return;
    }

    setSaving(true);
    setApiError('');
    try {
      await onSave({
        icon: values.icon,
        category: normalizedCategory,
        spent: Number(values.spent),
        budget: Number(values.budget),
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
      title={mode === 'add' ? 'Thêm hạng mục ngân sách' : 'Chỉnh sửa hạng mục'}
      icon={mode === 'add' ? <PlusIcon size={16} className='text-primary' /> : <PencilIcon size={15} className='text-primary' />}
      onCancel={onClose}
      onSubmit={handleSubmit(onSubmit)}
      submitDisabled={saving}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={mode === 'add' ? 'Thêm hạng mục' : 'Lưu thay đổi'}
      cancelLabel='Hủy'
    >
      <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className='flex flex-col min-h-0'>
        <DialogBody className='flex flex-col gap-5'>
          {/* Preview */}
          <div className='p-4 bg-secondary border border-border panel-inner'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-[18px]'>{icon}</span>
              <span className='text-[13px] font-semibold flex-1 truncate'>{category || 'Tên hạng mục'}</span>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>
                {formatCurrencyVND(spent)} / {formatCurrencyVND(budget)}
              </span>
            </div>
            <div className='h-1.5 bg-border rounded-full overflow-hidden'>
              <div className='h-full rounded-full transition-all duration-300' style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <div className='flex justify-between mt-1'>
              <span className='font-mono-dm text-[12px]' style={{ color: overBudget ? 'oklch(0.577 0.245 27.325)' : 'var(--muted)' }}>
                {overBudget ? 'Vượt ngân sách!' : `${pct}%`}
              </span>
              <span className='font-mono-dm text-[12px] text-muted-foreground'>Còn: {formatCurrencyVND(Math.max(0, budget - spent))}</span>
            </div>
          </div>

          {/* Icon picker */}
          <FormField label='Biểu tượng'>
            <div className='flex flex-wrap gap-2 pt-1'>
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type='button'
                  onClick={() => setValue('icon', ic, { shouldValidate: true, shouldDirty: true })}
                  className={['w-9 h-9 flex items-center justify-center rounded-sm text-[18px] transition-all hover:scale-110 border', icon === ic ? 'border-(--primary) bg-primary/10' : 'border-(--border) bg-(--secondary)'].join(' ')}
                >
                  {ic}
                </button>
              ))}
            </div>
          </FormField>

          {/* Category */}
          <FormField label='Tên hạng mục' required className={getFieldErrorLabelClass(!!errors.category)}>
            <Input
              className={`${iCls} ${getFieldErrorInputClass(!!errors.category)}`}
              placeholder='VD: Nhân sự, Cloud, Marketing...'
              autoFocus
              aria-invalid={!!errors.category}
              {...register('category', {
                validate: (value) => value.trim().length > 0 || 'Vui lòng nhập tên hạng mục.',
              })}
            />
            {errors.category?.message && <span className={getInlineErrorTextClass()}>{errors.category.message}</span>}
          </FormField>

          {/* Spent + Budget */}
          <div className='grid grid-cols-2 gap-3'>
            <FormField label='Đã chi (₫)'>
              <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.spent)}`} type='number' min={0} placeholder='0' aria-invalid={!!errors.spent} {...register('spent', { setValueAs: (v) => Number(v || 0) })} />
              {errors.spent?.message && <span className={getInlineErrorTextClass()}>{errors.spent.message}</span>}
            </FormField>
            <FormField label='Ngân sách (₫)' required className={getFieldErrorLabelClass(!!errors.budget)}>
              <Input className={`${iCls} ${getFieldErrorInputClass(!!errors.budget)}`} type='number' min={1} placeholder='0' aria-invalid={!!errors.budget} {...register('budget', { setValueAs: (v) => (v === '' ? Number.NaN : Number(v)) })} />
              {errors.budget?.message && <span className={getInlineErrorTextClass()}>{errors.budget.message}</span>}
            </FormField>
          </div>

          {/* Error */}
          {apiError && (
            <div className='flex items-center gap-2 bg-red-500/10 border border-[rgba(239,68,68,0.2)] rounded-sm px-3 py-2'>
              <AlertTriangleIcon size={13} className='text-red-500 shrink-0' />
              <span className='text-red-500 text-[12px]'>{apiError}</span>
            </div>
          )}
        </DialogBody>
      </form>
    </ModalShell>
  );
}
