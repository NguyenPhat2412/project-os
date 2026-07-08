'use client';

import { useState } from 'react';
import { HelpCircleIcon, Trash2Icon } from 'lucide-react';
import { DialogBody, DialogDescription, ModalShell } from './modal-shell';

export interface ConfirmDialogProps {
  open?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmDialog({ open = true, title, message, confirmLabel = 'Xác nhận', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell open onClose={onCancel} size='xs' title={title} onCancel={onCancel} onSubmit={handle} submitDanger={danger} submitDisabled={loading} submitLoading={loading} submitLoadingLabel='Đang xử lý...' submitLabel={confirmLabel}>
      <DialogBody className='pt-2 flex flex-row items-center gap-4 my-4 mx-auto'>
        <div
          className='w-12 h-12 rounded-full flex items-center justify-center'
          style={{
            background: danger ? 'bg-red-500/10' : 'color-mix(in oklch, var(--primary) 12%, transparent)',
            color: danger ? 'oklch(0.577 0.245 27.325)' : 'var(--primary)',
          }}
        >
          {danger ? <Trash2Icon size={24} /> : <HelpCircleIcon size={24} />}
        </div>

        <DialogDescription className='flex-1 text-[13px] leading-relaxed'>{message}</DialogDescription>
      </DialogBody>
    </ModalShell>
  );
}
