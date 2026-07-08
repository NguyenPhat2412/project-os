'use client';
/**
 * WikiViewSheet
 * ─────────────
 * Read-only markdown viewer for a wiki entry, displayed in a slide-in Sheet.
 * Replaces WikiViewDialog (ModalShell).
 */

import { DownloadIcon, FileTextIcon, PaperclipIcon, PencilIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/numberjs';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';

interface Props {
  open: boolean;
  wiki: WikiLink | null;
  onClose: () => void;
  onEdit: () => void;
}

export function WikiViewSheet({ open, wiki, onClose, onEdit }: Props) {
  if (!wiki) return null;

  const hasContent = !!wiki.content?.trim();
  const hasAttachments = !!wiki.attachments?.length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side='right' className='w-130 sm:max-w-130 bg-card border-l border-border p-0 flex flex-col'>
        <SheetHeader className='p-5 border-b border-border shrink-0'>
          <div className='flex items-center gap-2.5'>
            <span className='text-[22px]'>{wiki.icon}</span>
            <div className='flex-1 min-w-0'>
              <SheetTitle className='font-sans text-[16px] font-bold text-foreground leading-snug truncate'>{wiki.title}</SheetTitle>
              {wiki.updatedAt && <div className='font-mono-dm text-[12px] text-muted-foreground mt-0.5'>Cập nhật: {wiki.updatedAt}</div>}
            </div>
          </div>
          {wiki.summary && <p className='mt-2 text-[13px] text-muted-foreground leading-relaxed'>{wiki.summary}</p>}
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-5 py-4 space-y-5'>
          {/* Content */}
          {hasContent ? (
            <div className='wiki-content text-foreground text-[13.5px] leading-relaxed'>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{wiki.content!}</ReactMarkdown>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground'>
              <FileTextIcon size={32} className='opacity-40' />
              <p className='text-[13px]'>Wiki này chưa có nội dung.</p>
            </div>
          )}

          {/* Attachments */}
          {hasAttachments && (
            <div className='space-y-2'>
              <h3 className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
                <PaperclipIcon size={10} />
                Files đính kèm
                <span className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-[9px] font-mono-dm text-primary'>{wiki.attachments!.length}</span>
              </h3>
              <div className='space-y-1'>
                {wiki.attachments!.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2.5 px-3 py-2 rounded-sm border border-border bg-secondary hover:border-primary hover:bg-primary/10 group transition-colors'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='text-[12px] font-medium truncate group-hover:text-primary transition-colors'>{att.name}</div>
                      <div className='font-mono-dm text-[12px] text-muted-foreground mt-0.5'>
                        {formatFileSize(att.size)}
                        {att.uploadedAt && ` · ${att.uploadedAt}`}
                      </div>
                    </div>
                    <DownloadIcon size={12} className='text-muted-foreground group-hover:text-primary transition-colors shrink-0' />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='p-5 border-t border-border shrink-0'>
          <Button onClick={onEdit} className='w-full text-[13px] font-semibold'>
            <PencilIcon />
            Chỉnh sửa Wiki
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
