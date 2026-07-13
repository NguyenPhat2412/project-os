'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CheckIcon, ClockIcon, FileArchiveIcon, FileTextIcon, FileVideoIcon, ImageIcon, Loader2Icon, PaperclipIcon, PencilIcon, XIcon } from 'lucide-react';
import type { Attachment } from '@/lib/types/attachment';
import { formatFileSize } from '@/lib/numberjs';
import { deleteAttachment, uploadAttachment } from '@/lib/api/attachments';
import { useAttachmentViewer } from './use-attachment-viewer';

function fileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return <ImageIcon size={13} />;
  if (contentType.startsWith('video/')) return <FileVideoIcon size={13} />;
  if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('rar')) return <FileArchiveIcon size={13} />;
  return <FileTextIcon size={13} />;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface UploadingEntry {
  name: string;
  progress: number;
}

export interface FileAttachmentsFieldHandle {
  /** Upload all staged pending files → returns resulting Attachment[]. Call inside form submit for CREATE mode. */
  uploadPending: () => Promise<Attachment[]>;
}

interface Props {
  mode: 'create' | 'edit';
  storagePath: string;
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  /** EDIT mode: called after every upload/delete so parent can auto-save to Firestore immediately */
  onAutoSave?: (attachments: Attachment[]) => Promise<void>;
  disabled?: boolean;
}

// ── component ─────────────────────────────────────────────────────────────────

export const FileAttachmentsField = forwardRef<FileAttachmentsFieldHandle, Props>(function FileAttachmentsField({ mode, storagePath, attachments, onChange, onAutoSave, disabled }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<UploadingEntry[]>([]);
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const { openAttachment, viewerNode } = useAttachmentViewer();

  // ── imperative handle (CREATE mode) ────────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      uploadPending: async () => {
        const results: Attachment[] = [];
        for (const file of pendingFiles) {
          setUploading((p) => [...p, { name: file.name, progress: 0 }]);
          try {
            results.push(await uploadAttachment(file, storagePath));
          } finally {
            setUploading((p) => p.filter((u) => u.name !== file.name));
          }
        }
        setPendingFiles([]);
        return results;
      },
    }),
    [pendingFiles, storagePath],
  );

  // ── upload now (EDIT mode) ─────────────────────────────────────────────
  const uploadNow = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError(`"${file.name}" vượt quá 20 MB.`);
      return;
    }
    setUploading((p) => [...p, { name: file.name, progress: 0 }]);
    try {
      const attachment = await uploadAttachment(file, storagePath);
      const newList = [...attachments, attachment];
      onChange(newList);
      if (onAutoSave) await onAutoSave(newList).catch(() => {});
    } catch (uploadError) {
      setError(`Upload thất bại: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    } finally {
      setUploading((p) => p.filter((u) => u.name !== file.name));
    }
  };

  // ── handle file selection ──────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const valid = Array.from(files).filter((f) => {
      if (f.size > 20 * 1024 * 1024) {
        setError(`"${f.name}" vượt quá 20 MB.`);
        return false;
      }
      return true;
    });
    if (mode === 'create') {
      setPendingFiles((p) => [...p, ...valid]);
    } else {
      Promise.allSettled(valid.map(uploadNow));
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── remove saved attachment ────────────────────────────────────────────
  const handleRemoveSaved = async (att: Attachment, index: number) => {
    try {
      await deleteAttachment(att.storagePath);
    } catch (deleteError) {
      setError(`Xóa file thất bại: ${deleteError instanceof Error ? deleteError.message : 'Unknown error'}`);
      return;
    }
    const newList = attachments.filter((_, i) => i !== index);
    onChange(newList);
    if (mode === 'edit' && onAutoSave) await onAutoSave(newList).catch(() => {});
  };

  const handleRenameStart = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const handleRenameCommit = async (index: number) => {
    const trimmed = editingName.trim();
    setEditingIndex(null);
    if (!trimmed || trimmed === attachments[index].name) return;
    const newList = attachments.map((a, i) => (i === index ? { ...a, name: trimmed } : a));
    onChange(newList);
    if (mode === 'edit' && onAutoSave) await onAutoSave(newList).catch(() => {});
  };

  const isUploading = uploading.length > 0;

  return (
    <div className='space-y-1.5'>
      {/* Saved attachments */}
      {attachments.map((att, i) => (
        <div key={i} className='flex items-center gap-2 px-3 py-2 rounded-sm border'>
          <span className='text-muted-foreground shrink-0'>{fileIcon(att.contentType)}</span>

          {editingIndex === i ? (
            <input
              autoFocus
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameCommit(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRenameCommit(i);
                }
                if (e.key === 'Escape') setEditingIndex(null);
              }}
              className='flex-1 min-w-0 text-[12px] bg-transparent border-b border-primary outline-none py-0.5'
            />
          ) : (
            <button type='button' onClick={() => openAttachment(att)} className='flex-1 min-w-0 text-[12px] hover:text-primary truncate transition-colors text-left'>
              {att.name}
            </button>
          )}

          <span className='font-mono-dm text-[12px] text-muted-foreground shrink-0'>{formatFileSize(att.size)}</span>

          {!disabled && editingIndex === i ? (
            <button type='button' onClick={() => handleRenameCommit(i)} className='shrink-0 text-primary'>
              <CheckIcon size={13} />
            </button>
          ) : !disabled ? (
            <>
              <button type='button' onClick={() => handleRenameStart(i, att.name)} className='shrink-0 text-muted-foreground hover:text-primary' title='Đổi tên'>
                <PencilIcon size={12} />
              </button>
              <button type='button' onClick={() => handleRemoveSaved(att, i)} className='shrink-0 text-muted-foreground hover:text-red-500'>
                <XIcon size={13} />
              </button>
            </>
          ) : null}
        </div>
      ))}

      {/* Pending files (CREATE mode — not uploaded yet) */}
      {pendingFiles.map((file, i) => (
        <div key={i} className='flex items-center gap-2 px-3 py-2 rounded-sm border border-dashed group'>
          <ClockIcon size={13} className='text-muted-foreground shrink-0' />
          <span className='flex-1 min-w-0 text-[12px] text-muted-foreground truncate'>{file.name}</span>
          <span className='font-mono-dm text-[12px] text-muted-foreground shrink-0'>{formatFileSize(file.size)}</span>
          <span className='text-[12px] text-muted-foreground italic shrink-0'>chờ lưu</span>
          <button type='button' onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))} className='shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500'>
            <XIcon size={13} />
          </button>
        </div>
      ))}

      {/* Upload progress */}
      {uploading.map((u) => (
        <div key={u.name} className='flex items-center gap-2 px-3 py-2 rounded-sm border'>
          <Loader2Icon size={13} className='animate-spin text-primary shrink-0' />
          <span className='flex-1 min-w-0 text-[12px] text-muted-foreground truncate'>{u.name}</span>
          <div className='w-20 h-1.5 rounded-full bg-muted shrink-0'>
            <div className='h-full rounded-full bg-primary transition-all' style={{ width: `${u.progress}%` }} />
          </div>
          <span className='font-mono-dm text-[12px] text-primary shrink-0 w-8 text-right'>{u.progress}%</span>
        </div>
      ))}

      {/* Drop zone / button */}
      {!disabled && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={[
            'flex items-center gap-2 px-3 py-2.5 rounded-sm border border-dashed border-foreground/20',
            'text-[12px] text-muted-foreground transition-colors',
            isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:text-primary cursor-pointer',
          ].join(' ')}
        >
          <PaperclipIcon size={13} />
          <span>{mode === 'create' ? 'Chọn file đính kèm — sẽ upload khi nhấn Lưu' : 'Đính kèm — upload & lưu ngay'}</span>
          <span className='ml-auto font-mono-dm text-[12px]'>Tối đa 20 MB</span>
        </div>
      )}

      <input ref={inputRef} type='file' multiple className='hidden' onChange={(e) => handleFiles(e.target.files)} disabled={disabled || isUploading} />

      {error && <p className='text-[12px] text-destructive'>{error}</p>}
      {viewerNode}
    </div>
  );
});
