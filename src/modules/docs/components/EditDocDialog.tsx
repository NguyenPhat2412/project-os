'use client';
/**
 * EditDocDialog
 * ─────────────
 * Modal chỉnh sửa tài liệu — refactored để dùng FileAttachmentsField cho ALL file handling:
 * - Đổi tên hiển thị
 * - Đổi trạng thái (badge)
 * - Thêm / xoá files đính kèm (FileAttachmentsField với onAutoSave)
 * - File chính vẫn hiển thị nhưng không còn replace nữa — users dùng attachments field
 */

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useProject } from '@/store/project-store';
import type { DocEntry } from '@/modules/docs/collections/documents';
import type { Attachment } from '@/lib/types/attachment';
import type { FolderWithId } from '@/modules/docs/collections/folders';

// ── types ─────────────────────────────────────────────────────────────────────
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
  doc: DocEntry;
  folders: FolderWithId[];
  onClose: () => void;
  onSuccess: () => void;
  onRefetch?: () => void;
}

// ── schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  docName: z.string().trim().min(1, 'Tên tài liệu không được để trống'),
});
type FormValues = z.infer<typeof schema>;

// ── component ─────────────────────────────────────────────────────────────────
export function EditDocDialog(props: Props) {
  if (!props.open) return null;
  return <EditDocDialogContent key={props.doc.id} {...props} />;
}

function EditDocDialogContent({ open, doc: initialDoc, folders, onClose, onSuccess, onRefetch }: Props) {
  const { projectId } = useProject();
  const updateDocument = documentsCollection.useUpdate();
  const queryClient = useQueryClient();

  const [badge, setBadge] = useState<BadgeOption>(BADGE_OPTIONS.find((b) => b.label === initialDoc.badge.label) ?? BADGE_OPTIONS[0]);
  const [attachments, setAttachments] = useState<Attachment[]>(initialDoc.attachments ?? []);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(initialDoc.folderId);

  const attachmentsRef = useRef<FileAttachmentsFieldHandle>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty: formIsDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { docName: initialDoc.name },
  });

  const handleClose = () => onClose();

  const handleAutoSave = async (newAttachments: Attachment[]) => {
    try {
      await updateDocument.mutateAsync({
        id: initialDoc.id,
        data: { attachments: newAttachments } as Partial<DocEntry>,
      });
      await queryClient.invalidateQueries({ queryKey: documentsCollection.keys.lists() });
      onRefetch?.();
    } catch (err) {
      console.error('Auto-save attachments failed:', err);
    }
  };

  const handleSave = async (data: FormValues) => {
    const isBadgeDirty = badge.label !== initialDoc.badge.label;
    const isFolderDirty = selectedFolderId !== initialDoc.folderId;
    if (!formIsDirty && !isBadgeDirty && !isFolderDirty) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = {
        name: data.docName.trim(),
        badge: { label: badge.label, variant: badge.variant },
        folderId: selectedFolderId,
      };

      await updateDocument.mutateAsync({ id: initialDoc.id, data: updates as Partial<DocEntry> });
      await queryClient.invalidateQueries({ queryKey: documentsCollection.keys.lists() });

      setTimeout(() => {
        onSuccess();
      }, 400);
    } catch (err) {
      console.error('Save doc failed:', err);
    }
  };

  if (!open) return null;

  const isBusy = updateDocument.isPending;
  const isBadgeDirty = badge.label !== initialDoc.badge.label;
  const isFolderDirty = selectedFolderId !== initialDoc.folderId;
  const isDirty = formIsDirty || isBadgeDirty || isFolderDirty;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      maxWidth='max-w-[95vw] md:max-w-[85vw] lg:max-w-[1000px] xl:max-w-[1100px]'
      title='Chỉnh sửa tài liệu'
      icon={<span className='text-[20px]'>{initialDoc.icon}</span>}
      onCancel={handleClose}
      cancelDisabled={isBusy}
      onSubmit={handleSubmit(handleSave)}
      submitDisabled={!isDirty || !isValid || isBusy}
      submitLoading={isBusy}
      submitLoadingLabel='Đang lưu...'
      submitLabel='Lưu thay đổi'
      cancelLabel='Huỷ'
    >
      <div className='px-6 py-5 space-y-4'>
        {/* Current doc info */}
        <div className='flex items-center gap-3 p-3 bg-secondary border border-border rounded-sm'>
          <div className='text-[18px]'>{initialDoc.icon}</div>
          <div className='flex-1 min-w-0'>
            <div className='text-[12px] font-medium truncate text-muted-foreground'>{initialDoc.name}</div>
            <div className='font-mono-dm text-[12px] text-muted-foreground mt-0.5'>
              {initialDoc.type} · {initialDoc.size} · {initialDoc.date}
            </div>
          </div>
          {initialDoc.downloadUrl && (
            <a href={initialDoc.downloadUrl} target='_blank' rel='noopener noreferrer' className='shrink-0 text-[12px] text-primary hover:underline'>
              Mở file
            </a>
          )}
        </div>

        {/* Document name */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Tên tài liệu</Label>
          <Input {...register('docName')} disabled={isBusy} className={getFieldErrorInputClass(!!errors.docName)} />
          {errors.docName && <span className={getInlineErrorTextClass()}>{errors.docName.message}</span>}
        </div>

        {/* Badge / status */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Trạng thái</Label>
          <div className='flex gap-2 flex-wrap'>
            {BADGE_OPTIONS.map((opt) => (
              <Button key={opt.label} size='xs' variant={badge.label === opt.label ? 'default' : 'outline'} onClick={() => setBadge(opt)} disabled={isBusy}>
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Folder */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Thư mục lưu trữ</Label>
          <FolderSelectDropdown
            value={selectedFolderId}
            folders={folders}
            onChange={(id: string | undefined) => setSelectedFolderId(id)}
            disabled={isBusy}
          />
        </div>

        {/* File attachments — auto-saves after each upload/delete */}
        <div className='space-y-1.5'>
          <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>Files đính kèm</Label>
          <FileAttachmentsField ref={attachmentsRef} mode='edit' storagePath={`projects/${projectId}/docs/${initialDoc.id}/attachments`} attachments={attachments} onChange={setAttachments} onAutoSave={handleAutoSave} disabled={isBusy} />
        </div>
      </div>
    </ModalShell>
  );
}
