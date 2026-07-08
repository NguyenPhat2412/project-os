'use client';
/**
 * UploadDocDialog
 * ───────────────
 * Modal tạo tài liệu — tất cả files qua FileAttachmentsField (giống Wiki).
 * Chỉ cần nhập tên, chọn trạng thái, thư mục và đính kèm files.
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentsCollection } from '@/modules/docs/collections/documents';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { FileAttachmentsField, FileAttachmentsFieldHandle } from '@/components/ui/shared/file-attachments-field';
import { FolderSelectDropdown } from '@/modules/docs/components/FolderSelectDropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { formatDate } from '@/lib/dayjs';
import type { Attachment } from '@/lib/types/attachment';
import type { FolderWithId } from '@/modules/docs/collections/folders';

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: '📋',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    csv: '📊',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
    svg: '🖼️',
    mp4: '🎬',
    mov: '🎬',
    avi: '🎬',
    mkv: '🎬',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    md: '📋',
    txt: '📄',
    yaml: '⚙️',
    yml: '⚙️',
    json: '🔧',
    env: '🔧',
    fig: '🎨',
    sketch: '🎨',
  };
  return map[ext] ?? '📄';
}

function getFileType(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() ?? 'FILE';
}

type BadgeOption = { label: string; variant: 'green' | 'accent' | 'yellow' | 'muted' | 'red' | 'purple' };

const BADGE_OPTIONS: BadgeOption[] = [
  { label: 'Draft', variant: 'muted' },
  { label: 'Active', variant: 'accent' },
  { label: 'Updated', variant: 'yellow' },
  { label: 'Approved', variant: 'green' },
  { label: 'Archived', variant: 'red' },
];

interface Props {
  open: boolean;
  folders: FolderWithId[];
  nextDocIndex: number;
  onClose: () => void;
  onSuccess: () => void;
}

const schema = z.object({
  docName: z.string().trim().min(1, 'Tên tài liệu không được để trống'),
});
type FormValues = z.infer<typeof schema>;

export function UploadDocDialog({ open, folders, nextDocIndex, onClose, onSuccess }: Props) {
  const [badge, setBadge] = useState<BadgeOption>(BADGE_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const attachmentsRef = useRef<FileAttachmentsFieldHandle>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);

  const createDocument = documentsCollection.useSet();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isValid, isDirty: formIsDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { docName: '' },
  });

  const reset = () => {
    setBadge(BADGE_OPTIONS[0]);
    setSaving(false);
    setErrorMsg('');
    setAttachments([]);
    setSelectedFolderId(undefined);
    resetForm();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async (data: FormValues) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const docId = `DOC-${String(nextDocIndex).padStart(2, '0')}`;
      const pendingAttachments = (await attachmentsRef.current?.uploadPending()) ?? [];
      const allAttachments: Attachment[] = [...attachments, ...pendingAttachments];

      // Compute icon/type/size from first attachment
      const firstFile = allAttachments[0];
      const icon = firstFile ? getFileIcon(firstFile.name) : '📄';
      const type = firstFile ? getFileType(firstFile.name) : 'FILE';
      const size = firstFile ? `${(firstFile.size / 1024).toFixed(1)} KB` : '—';

      const entry = {
        id: docId,
        icon,
        name: data.docName.trim(),
        type,
        size,
        date: formatDate(new Date()),
        badge: { label: badge.label, variant: badge.variant },
        downloadUrl: firstFile?.url,
        storagePath: firstFile?.storagePath,
        order: nextDocIndex,
        attachments: allAttachments,
        folderId: selectedFolderId,
      };

      await createDocument.mutateAsync({ id: docId, data: entry });
      reset();
      onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Folder changed from initial state (initially undefined)
  const folderDirty = selectedFolderId !== undefined;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidth='max-w-[90vw] md:max-w-[80vw] lg:max-w-[800px]'
      title='Tạo tài liệu'
      icon={<span className='text-[20px]'>📄</span>}
      onCancel={handleClose}
      cancelDisabled={saving}
      onSubmit={handleSubmit(handleSave)}
      submitDisabled={(!formIsDirty && !folderDirty) || !isValid || saving}
      submitLoading={saving}
      submitLabel='Lưu tài liệu'
      cancelLabel='Huỷ'
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Document name */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Tên tài liệu</Label>
          <Input {...register('docName')} disabled={saving} placeholder='Nhập tên tài liệu...' className={getFieldErrorInputClass(!!errors.docName)} />
          {errors.docName && <span className={getInlineErrorTextClass()}>{errors.docName.message}</span>}
        </div>

        {/* Badge / status */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Trạng thái</Label>
          <div className='flex gap-2 flex-wrap'>
            {BADGE_OPTIONS.map((opt) => (
              <Button key={opt.label} size='xs' variant={badge.label === opt.label ? 'default' : 'outline'} onClick={() => setBadge(opt)} disabled={saving}>
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Folder selector */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Thư mục lưu trữ</Label>
          <FolderSelectDropdown value={selectedFolderId} folders={folders} onChange={(id: string | undefined) => setSelectedFolderId(id)} disabled={saving} />
        </div>

        {/* Files */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Files đính kèm</Label>
          <FileAttachmentsField ref={attachmentsRef} mode='create' storagePath={`projects/default/docs/DOC-${String(nextDocIndex).padStart(2, '0')}/attachments`} attachments={attachments} onChange={setAttachments} disabled={saving} />
        </div>

        {/* Error */}
        {errorMsg && <div className='bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[12px] text-destructive'>{errorMsg}</div>}
      </div>
    </ModalShell>
  );
}
