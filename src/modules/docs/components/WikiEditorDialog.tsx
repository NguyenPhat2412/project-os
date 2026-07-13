'use client';
/**
 * WikiEditorDialog
 * ────────────────
 * Split-pane Markdown editor for wiki entries.
 * - Left: toolbar + textarea
 * - Right: live preview (react-markdown + remark-gfm)
 * - Create new or edit existing wiki entry in API
 * - Delete from API
 */

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormField } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/shared/markdown-editor';
import { ModalShell } from '@/components/ui/shared/modal-shell';
import { FileAttachmentsField, FileAttachmentsFieldHandle } from '@/components/ui/shared/file-attachments-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { wikiLinksCollection } from '@/modules/docs/collections/wikiLinks';
import { getFieldErrorInputClass, getInlineErrorTextClass } from '@/lib/form-validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProject } from '@/store/project-store';

import type { WikiLink } from '@/modules/docs/collections/wikiLinks';
import type { Attachment } from '@/lib/types/attachment';
// ── emoji icon options ────────────────────────────────────────────────────────
const ICON_OPTIONS = ['⚙️', '📝', '✅', '🐛', '📖', '🚀', '🔒', '🗂️', '💡', '🧪', '📐', '🔌', '🎨', '📦', '🔧', '🌐', '📊', '🔑', '📋', '⭐', '🏗️', '🔄', '📡', '🛠️', '💬', '📌', '🗺️', '⚡', '🎯', '🔍'];

// ── helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── schema ────────────────────────────────────────────────────────────────────
const wikiSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề không được để trống'),
  summary: z.string().trim().max(200, 'Tóm tắt tối đa 200 ký tự').optional(),
});
type WikiFormValues = z.infer<typeof wikiSchema>;

// ── props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  wiki: WikiLink | null; // null → create mode
  nextWikiIndex: number;
  onClose: () => void;
  onSuccess: () => void;
}

// ── component ─────────────────────────────────────────────────────────────────
export function WikiEditorDialog(props: Props) {
  if (!props.open) return null;
  return <WikiEditorDialogContent key={props.wiki?.id ?? `new-${props.nextWikiIndex}`} {...props} />;
}

function WikiEditorDialogContent({ open, wiki, nextWikiIndex, onClose, onSuccess }: Props) {
  const { projectId } = useProject();
  const isNew = wiki === null;

  const [icon, setIcon] = useState(wiki?.icon ?? '📝');
  const [content, setContent] = useState(wiki?.content ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(wiki?.attachments ?? []);
  const [status, setStatus] = useState<'idle' | 'saving' | 'deleting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const attachmentsRef = useRef<FileAttachmentsFieldHandle>(null);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isValid, isDirty: formIsDirty },
  } = useForm<WikiFormValues>({
    resolver: zodResolver(wikiSchema),
    mode: 'onChange',
    defaultValues: { title: wiki?.title ?? '', summary: wiki?.summary ?? '' },
  });

  const handleClose = () => {
    if (isBusy) return;
    resetForm({ title: wiki?.title ?? '', summary: wiki?.summary ?? '' });
    setContent(wiki?.content ?? '');
    setIcon(wiki?.icon ?? '📝');
    setStatus('idle');
    setErrorMsg('');
    onClose();
  };

  const setWikiLink = wikiLinksCollection.useSet();
  const updateWikiLink = wikiLinksCollection.useUpdate();
  const deleteWikiLink = wikiLinksCollection.useDelete();
  const queryClient = useQueryClient();

  const handleAutoSave = async (newAttachments: Attachment[]) => {
    if (isNew || !wiki) return;
    try {
      await updateWikiLink.mutateAsync({ id: wiki.id, data: { attachments: newAttachments } as never });
      await queryClient.invalidateQueries({ queryKey: wikiLinksCollection.keys.lists() });
    } catch (err) {
      console.error('Auto-save wiki attachments failed:', err);
    }
  };

  const onSubmit = async (data: WikiFormValues) => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const now = formatDate(new Date());

      // CREATE mode: upload pending attachments first
      const pendingUploaded = isNew ? ((await attachmentsRef.current?.uploadPending()) ?? []) : [];
      const finalAttachments = isNew ? [...attachments, ...pendingUploaded] : attachments;

      const wikiData = {
        title: data.title.trim(),
        icon,
        summary: data.summary?.trim() ?? '',
        content,
        attachments: finalAttachments,
        updatedAt: now,
        ...(isNew ? { order: nextWikiIndex - 1 } : {}),
      };

      if (isNew) {
        const newId = `WL-${String(nextWikiIndex).padStart(2, '0')}`;
        await setWikiLink.mutateAsync({ id: newId, data: wikiData as never });
      } else {
        await updateWikiLink.mutateAsync({ id: wiki.id, data: wikiData as never });
      }
      await queryClient.invalidateQueries({ queryKey: wikiLinksCollection.keys.lists() });
      setStatus('done');
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 600);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (isNew || !wiki) return;
    setStatus('deleting');
    setErrorMsg('');
    try {
      await deleteWikiLink.mutateAsync(wiki.id);
      await queryClient.invalidateQueries({ queryKey: wikiLinksCollection.keys.lists() });
      onClose();
      onSuccess();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  if (!open) return null;

  const isBusy = status === 'saving' || status === 'deleting';
  const isDirty = isNew ? true : formIsDirty || icon !== (wiki?.icon ?? '📝') || content !== (wiki?.content ?? '');

  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (!isBusy) handleClose();
      }}
      size='2xl'
      className='max-h-[90vh] flex flex-col'
      title={isNew ? 'Tạo Wiki' : 'Chỉnh sửa Wiki'}
      icon={<span className='text-[20px]'>{icon}</span>}
      closeDisabled={isBusy}
      headerClassName='shrink-0'
      footerClassName='items-center gap-3 px-5 shrink-0'
      onDelete={!isNew ? handleDelete : undefined}
      deleteDisabled={isBusy}
      deleteLabel='Xoá'
      onCancel={handleClose}
      cancelDisabled={isBusy}
      cancelLabel='Huỷ'
      onSubmit={() => {
        void handleSubmit(onSubmit)();
      }}
      submitDisabled={!isValid || !isDirty || isBusy}
      submitLoading={status === 'saving'}
      submitLoadingLabel='Đang lưu...'
      submitLabel={isNew ? 'Tạo Wiki' : 'Lưu thay đổi'}
    >
      {/* ── Icon picker ── */}
      <div className='px-5 py-4 border-b border-border shrink-0'>
        <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2'>Biểu tượng</div>
        <div className='flex flex-wrap gap-2'>
          {ICON_OPTIONS.map((em) => (
            <button
              key={em}
              type='button'
              onClick={() => setIcon(em)}
              disabled={isBusy}
              className={['w-9 h-9 flex items-center justify-center rounded-sm text-[18px] transition-all hover:scale-110 border', em === icon ? 'border-primary bg-primary/10' : 'border-border bg-secondary'].join(' ')}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* ── Title input ── */}
      <div className='px-5 py-3 border-b border-border shrink-0'>
        <div className='flex flex-col gap-1'>
          <Input {...register('title')} disabled={isBusy} placeholder='Tiêu đề wiki...' className={`h-10 text-[15px] font-semibold ${getFieldErrorInputClass(!!errors.title)}`} />
          {errors.title && <span className={getInlineErrorTextClass()}>{errors.title.message}</span>}

          <FormField label='Tóm tắt' className='pt-1'>
            <Textarea {...register('summary')} disabled={isBusy} rows={2} maxLength={200} placeholder='Mô tả ngắn nội dung wiki...' className={`text-[13px] ${getFieldErrorInputClass(!!errors.summary)}`} />
          </FormField>
          {errors.summary && <span className={getInlineErrorTextClass()}>{errors.summary.message}</span>}

          {wiki?.updatedAt && <span className='text-[12px] text-muted-foreground'>Cập nhật {wiki.updatedAt}</span>}
          {status === 'done' && <span className='text-[12px] text-green-500'>Đã lưu!</span>}
          {status === 'error' && <span className='text-[12px] text-red-500 truncate'>{errorMsg}</span>}
        </div>
      </div>

      {/* ── Markdown Editor ── */}
      <div className='flex-1 overflow-hidden px-5 py-3'>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          disabled={isBusy}
          placeholder={'# Bắt đầu viết wiki...\n\nDùng Markdown để định dạng nội dung.\n\n## Hướng dẫn\n- **in đậm**, *in nghiêng*\n- `code`, ```code block```\n- [link](https://)\n- Danh sách, bảng, blockquote...'}
          minHeight='300px'
        />
      </div>

      {/* ── Attachments ── */}
      <div className='px-5 py-4 border-t border-border shrink-0'>
        <Label className='block text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2'>Files đính kèm</Label>
        <FileAttachmentsField
          ref={attachmentsRef}
          mode={isNew ? 'create' : 'edit'}
          storagePath={`projects/${projectId}/wiki/${isNew ? `WL-${String(nextWikiIndex).padStart(2, '0')}` : wiki!.id}/attachments`}
          attachments={attachments}
          onChange={setAttachments}
          onAutoSave={!isNew ? handleAutoSave : undefined}
          disabled={isBusy}
        />
      </div>
    </ModalShell>
  );
}
