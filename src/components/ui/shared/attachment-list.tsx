'use client';
import { FileArchiveIcon, FileTextIcon, FileVideoIcon, ImageIcon } from 'lucide-react';
import type { Attachment } from '@/lib/types/attachment';
import { formatFileSize } from '@/lib/numberjs';
import { useAttachmentViewer } from './use-attachment-viewer';

function fileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return <ImageIcon size={13} />;
  if (contentType.startsWith('video/')) return <FileVideoIcon size={13} />;
  if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('rar')) return <FileArchiveIcon size={13} />;
  return <FileTextIcon size={13} />;
}

interface Props {
  attachments: Attachment[];
}

export function AttachmentList({ attachments }: Props) {
  const { openAttachment, viewerNode } = useAttachmentViewer();

  if (attachments.length === 0) return null;

  return (
    <>
      <div className='space-y-1.5'>
        {attachments.map((att, i) => (
          <button
            key={i}
            type='button'
            onClick={() => openAttachment(att)}
            className='w-full flex items-center gap-2 px-3 py-2 rounded-sm border border-border bg-secondary hover:border-primary hover:bg-primary/10 group transition-colors text-left'
          >
            <span className='text-muted-foreground group-hover:text-primary shrink-0 transition-colors'>{fileIcon(att.contentType)}</span>
            <span className='flex-1 min-w-0 text-[12px] text-foreground group-hover:text-primary truncate transition-colors'>{att.name}</span>
            <span className='font-mono-dm text-[12px] text-muted-foreground shrink-0'>{formatFileSize(att.size)}</span>
          </button>
        ))}
      </div>
      {viewerNode}
    </>
  );
}
