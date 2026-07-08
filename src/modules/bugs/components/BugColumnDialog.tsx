'use client';

import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { bugColumnsCollection } from '@/modules/bugs/collections/bugColumns';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BugColumn } from '@/modules/bugs/types/bug';

// ── 10 preset color swatches ──────────────────────────────────────────────────
const PRESET_COLORS = [
  { label: 'Đỏ', value: '#ef4444' },
  { label: 'Cam', value: '#f97316' },
  { label: 'Vàng', value: '#f59e0b' },
  { label: 'Xanh lá', value: '#22c55e' },
  { label: 'Lam', value: '#3b82f6' },
  { label: 'Ngọc', value: '#14b8a6' },
  { label: 'Tím', value: '#8b5cf6' },
  { label: 'Hồng', value: '#ec4899' },
  { label: 'Xám', value: '#64748b' },
  { label: 'Đỏ đậm', value: '#dc2626' },
];

interface Props {
  open: boolean;
  existingColumns: BugColumn[];
  column?: BugColumn | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_COLOR = PRESET_COLORS[0].value;

/** Sanitize a title into a Firestore-safe document ID */
function sanitizeId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function BugColumnDialog({ open, existingColumns, column, onClose, onSuccess }: Props) {
  const isEdit = !!column;

  const [title, setTitle] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [order, setOrder] = useState('0');
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (column) {
      flushSync(() => {
        setTitle(column.title);
        setColor(column.color);
        setOrder(String(column.order ?? 0));
      });
    } else {
      flushSync(() => {
        setTitle('');
        setColor(DEFAULT_COLOR);
        setOrder(String(existingColumns.reduce((max, c) => Math.max(max, c.order ?? 0), -1) + 1));
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiError('');
  }, [column, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async () => {
    setApiError('');
    const trimmedTitle = title.trim();
    const parsedOrder = Number.parseInt(order, 10);

    if (!trimmedTitle) {
      setApiError('Tên cột không được để trống.');
      return;
    }
    if (Number.isNaN(parsedOrder) || parsedOrder < 0) {
      setApiError('Thứ tự phải là số nguyên ≥ 0.');
      return;
    }

    setSaving(true);

    try {
      // Edit: keep existing doc ID so we update in place.
      // Create: generate a clean ID from the title (avoids special chars like apostrophes).
      const docId = isEdit && column ? column.id : sanitizeId(trimmedTitle);
      await bugColumnsCollection.helpers.set(docId, { title: trimmedTitle, color, order: parsedOrder } as never);
      onSuccess();
      onClose();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Không thể lưu cột.');
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      size='sm'
      title={isEdit ? 'Sửa cột Bug' : 'Thêm cột Bug'}
      icon={<span className='text-[18px]'>🐛</span>}
      onCancel={handleClose}
      cancelDisabled={saving}
      cancelLabel='Huỷ'
      onSubmit={handleSubmit}
      submitDisabled={saving || !title.trim()}
      submitLoading={saving}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Tạo cột'}
    >
      <div className='px-6 py-5 space-y-4'>
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Tên cột</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} placeholder='Ví dụ: Open' className='text-[13px]' />
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Thứ tự</Label>
            <Input value={order} onChange={(e) => setOrder(e.target.value)} type='number' min={0} disabled={saving} placeholder='0' className='text-[13px]' />
          </div>
        </div>

        <div className='space-y-2'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Màu</Label>
          <div className='flex items-center gap-2 flex-wrap'>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type='button'
                title={c.label}
                onClick={() => setColor(c.value)}
                className='w-7 h-7 rounded-full transition-all duration-100 hover:scale-110'
                style={{
                  background: c.value,
                  outline: color === c.value ? '2.5px solid white' : '2.5px solid transparent',
                  outlineOffset: '1px',
                  boxShadow: color === c.value ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {apiError ? <div className='rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive'>{apiError}</div> : null}
      </div>
    </ModalShell>
  );
}
