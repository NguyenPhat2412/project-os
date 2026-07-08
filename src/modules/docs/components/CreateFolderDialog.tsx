'use client';

import { useState } from 'react';
import { FolderIcon } from 'lucide-react';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { FolderSelectDropdown } from '@/modules/docs/components/FolderSelectDropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FolderWithId } from '@/modules/docs/collections/folders';

interface CreateFolderDialogProps {
  open: boolean;
  folders: FolderWithId[];
  parentId?: string;
  /** Folder ID to exclude from parent selection (when editing a folder) */
  excludeId?: string;
  onClose: () => void;
  onSuccess: (name: string, icon: string, parentId: string | undefined) => void;
}

const ICON_OPTIONS = ['📁', '📋', '🏗️', '🔌', '🎨', '📊', '🎬', '📦', '🔧', '📝', '🗂️', '🏃'];

export function CreateFolderDialog({ open, folders, parentId, excludeId, onClose, onSuccess }: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [selectedParent, setSelectedParent] = useState<string | undefined>(parentId);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSuccess(name.trim(), icon, selectedParent);
    setSaving(false);
    setName('');
    setIcon('📁');
    setSelectedParent(undefined);
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      maxWidth='max-w-[400px]'
      title='Tạo thư mục'
      icon={<FolderIcon size={18} className='text-amber-600' />}
      onCancel={onClose}
      cancelDisabled={saving}
      onSubmit={() => { if (name.trim()) { handleSubmit(); } }}
      submitDisabled={!name.trim() || saving}
      submitLoading={saving}
      submitLabel='Tạo thư mục'
      cancelLabel='Huỷ'
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Name */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Tên thư mục</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Nhập tên thư mục...'
            disabled={saving}
            autoFocus
          />
        </div>

        {/* Icon */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Biểu tượng</Label>
          <div className='flex flex-wrap gap-1.5'>
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                type='button'
                onClick={() => setIcon(ic)}
                className={['w-8 h-8 rounded-sm border text-[16px] flex items-center justify-center transition-colors', icon === ic ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60'].join(' ')}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Parent folder */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Thư mục cha (tuỳ chọn)</Label>
          <FolderSelectDropdown
            value={selectedParent}
            folders={folders}
            onChange={(id) => setSelectedParent(id)}
            disabled={saving}
            excludeId={excludeId}
          />
        </div>
      </div>
    </ModalShell>
  );
}
