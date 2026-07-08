'use client';
import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DownloadIcon, Loader2Icon } from 'lucide-react';
import { DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DialogHeader, ModalHeaderBar } from '@/components/ui/shared/modal-shell';
import type { Attachment } from '@/lib/types/attachment';

interface Props {
  attachment: Attachment;
  onClose: () => void;
}

const GOOGLE_VIEWER = 'https://docs.google.com/viewer?embedded=true&url=';

export function OfficeViewDialog({ attachment, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = `${GOOGLE_VIEWER}${encodeURIComponent(attachment.url)}`;

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogOverlay className='bg-black/85' />
        <DialogPrimitive.Content className='fixed inset-[2vh_2vw] z-50 flex flex-col bg-card border border-border panel-modal focus:outline-none'>
          <DialogHeader>
            <ModalHeaderBar
              heading={attachment.name}
              onClose={onClose}
              actions={
                <a href={attachment.url} target='_blank' rel='noopener noreferrer'>
                  <Button type='button' variant='ghost' size='icon-sm' className='text-muted-foreground hover:text-foreground hover:bg-secondary' title='Tải xuống'>
                    <DownloadIcon size={14} />
                  </Button>
                </a>
              }
            />
          </DialogHeader>

          <div className='flex-1 overflow-hidden rounded-b-sm relative'>
            {!loaded && (
              <div className='absolute inset-0 flex items-center justify-center bg-card'>
                <div className='flex flex-col items-center gap-3'>
                  <Loader2Icon size={28} className='animate-spin text-primary' />
                  <span className='text-[12px] text-muted-foreground'>Đang tải tài liệu từ Google Docs...</span>
                </div>
              </div>
            )}
            <iframe src={embedUrl} title={attachment.name} onLoad={() => setLoaded(true)} className='w-full h-full border-0' allowFullScreen />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
