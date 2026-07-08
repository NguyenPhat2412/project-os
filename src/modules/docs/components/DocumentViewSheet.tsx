'use client';
/**
 * DocumentViewSheet
 * ─────────────────
 * Slide-in Sheet hiển thị chi tiết tài liệu:
 * - Icon, tên, loại, kích thước, ngày, trạng thái
 * - Download file chính (downloadUrl)
 * - Danh sách files đính kèm (attachments[]) — click để mở
 * - Nút Edit để mở EditDocDialog
 */

import { DownloadIcon, FileTextIcon, PencilIcon, PaperclipIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PageBadge } from '@/components/ui/page-badge';
import { formatFileSize } from '@/lib/numberjs';
import { useAttachmentViewer } from '@/components/ui/shared/use-attachment-viewer';
import type { DocEntry } from '@/modules/docs/collections/documents';
import type { WithId } from '@/lib/firestore-rq';

type DocWithId = WithId<DocEntry>;
type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

interface Props {
  open: boolean;
  doc: DocWithId | null;
  onClose: () => void;
  onEdit: () => void;
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith('image/')) return <span className='text-muted-foreground'>🖼️</span>;
  if (contentType.startsWith('video/')) return <span className='text-muted-foreground'>🎬</span>;
  if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('rar')) return <span className='text-muted-foreground'>📦</span>;
  return <FileTextIcon size={13} className='text-muted-foreground' />;
}

export function DocumentViewSheet({ open, doc, onClose, onEdit }: Props) {
  const { openAttachment, viewerNode } = useAttachmentViewer();

  if (!doc) return null;

  const hasAttachments = doc.attachments && doc.attachments.length > 0;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side='right' className='w-[480px] sm:max-w-[480px] bg-card border-l border-border p-0 flex flex-col'>
        {/* ── Header ── */}
        <SheetHeader className='p-5 border-b border-border shrink-0'>
          <div className='flex items-start gap-3'>
            <div className='w-11 h-11 bg-secondary border border-border rounded-sm flex items-center justify-center text-[22px] shrink-0'>{doc.icon}</div>
            <div className='flex-1 min-w-0'>
              <SheetTitle className='font-sans text-[16px] font-bold text-foreground leading-snug'>{doc.name}</SheetTitle>
              <div className='flex items-center gap-2 mt-1.5'>
                <span className='font-mono-dm text-[12px] text-muted-foreground uppercase'>{doc.type}</span>
                <span className='text-muted-foreground'>·</span>
                <span className='font-mono-dm text-[12px] text-muted-foreground'>{doc.size}</span>
                <span className='text-muted-foreground'>·</span>
                <span className='font-mono-dm text-[12px] text-muted-foreground'>{doc.date}</span>
              </div>
              <div className='mt-2'>
                <PageBadge variant={doc.badge.variant as BadgeVariant}>{doc.badge.label}</PageBadge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <div className='flex-1 overflow-y-auto px-5 py-4 space-y-5'>
          {/* Main file */}
          {doc.downloadUrl && (
            <div className='space-y-2'>
              <h3 className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider'>File chính</h3>
              <div className='flex items-center gap-3 px-3 py-2.5 rounded-sm border border-border bg-secondary group'>
                <div className='text-[18px] shrink-0'>{doc.icon}</div>
                <div className='flex-1 min-w-0'>
                  <div className='text-[12px] font-medium truncate'>{doc.name}</div>
                  <div className='font-mono-dm text-[12px] text-muted-foreground mt-0.5'>
                    {doc.type} · {doc.size}
                  </div>
                </div>
                <a
                  href={doc.downloadUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='shrink-0 w-7 h-7 flex items-center justify-center rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all'
                  title='Tải xuống file chính'
                >
                  <DownloadIcon size={13} />
                </a>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className='space-y-2'>
            <h3 className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
              <PaperclipIcon size={10} />
              Files đính kèm
              {hasAttachments && <span className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-[9px] font-mono-dm text-primary'>{doc.attachments!.length}</span>}
            </h3>

            {hasAttachments ? (
              <div className='space-y-1'>
                {doc.attachments!.map((att, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => openAttachment(att)}
                    className='w-full flex items-center gap-2.5 px-3 py-2 rounded-sm border border-border bg-secondary hover:border-primary hover:bg-primary/10 group transition-colors text-left'
                  >
                    <FileTypeIcon contentType={att.contentType} />
                    <div className='flex-1 min-w-0'>
                      <div className='text-[12px] font-medium truncate group-hover:text-primary transition-colors'>{att.name}</div>
                      <div className='font-mono-dm text-[12px] text-muted-foreground mt-0.5'>
                        {formatFileSize(att.size)}
                        {att.uploadedAt && ` · ${att.uploadedAt}`}
                      </div>
                    </div>
                    <DownloadIcon size={12} className='text-muted-foreground group-hover:text-primary transition-colors shrink-0' />
                  </button>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground border border-dashed border-border rounded-sm'>
                <PaperclipIcon size={20} className='opacity-40' />
                <p className='text-[12px]'>Không có file đính kèm</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className='p-5 border-t border-border shrink-0'>
          <Button onClick={onEdit} className='w-full text-[13px] font-semibold'>
            <PencilIcon size={13} />
            Chỉnh sửa tài liệu
          </Button>
        </div>
      </SheetContent>
      {viewerNode}
    </Sheet>
  );
}
