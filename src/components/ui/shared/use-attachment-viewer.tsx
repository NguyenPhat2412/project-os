'use client';
import { useState } from 'react';
import { ImageViewDialog } from './image-view-dialog';
import { VideoViewDialog } from './video-view-dialog';
import { PdfViewDialog } from './pdf-view-dialog';
import { OfficeViewDialog } from './office-view-dialog';
import type { Attachment } from '@/lib/types/attachment';

type ViewerType = 'image' | 'video' | 'pdf' | 'office' | 'download';

const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

export function getViewerType(contentType: string, name: string): ViewerType {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType === 'application/pdf') return 'pdf';

  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (OFFICE_EXTS.includes(ext)) return 'office';
  if (
    contentType.includes('msword') ||
    contentType.includes('officedocument') ||
    contentType.includes('ms-excel') ||
    contentType.includes('ms-powerpoint')
  ) return 'office';

  return 'download';
}

/**
 * Hook to open the correct viewer dialog for any attachment.
 * Usage:
 *   const { openAttachment, viewerNode } = useAttachmentViewer();
 *   // render {viewerNode} anywhere in JSX
 *   // call openAttachment(att) on click
 */
export function useAttachmentViewer() {
  const [viewing, setViewing] = useState<Attachment | null>(null);

  const openAttachment = (att: Attachment) => {
    const type = getViewerType(att.contentType, att.name);
    if (type === 'download') {
      window.open(att.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setViewing(att);
  };

  const close = () => setViewing(null);

  let viewerNode: React.ReactNode = null;
  if (viewing) {
    const type = getViewerType(viewing.contentType, viewing.name);
    if (type === 'image') viewerNode = <ImageViewDialog attachment={viewing} onClose={close} />;
    else if (type === 'video') viewerNode = <VideoViewDialog attachment={viewing} onClose={close} />;
    else if (type === 'pdf') viewerNode = <PdfViewDialog attachment={viewing} onClose={close} />;
    else if (type === 'office') viewerNode = <OfficeViewDialog attachment={viewing} onClose={close} />;
  }

  return { openAttachment, viewerNode };
}
