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

export function VideoViewDialog({ attachment, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <DialogPrimitive.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogOverlay className='bg-black/95' />
        <DialogPrimitive.Content className='fixed inset-0 z-50 flex flex-col focus:outline-none'>
          <DialogHeader>
            <ModalHeaderBar
              heading={attachment.name}
              onClose={onClose}
              actions={
                <a href={attachment.url} download={attachment.name} target='_blank' rel='noopener noreferrer'>
                  <Button type='button' variant='ghost' size='icon-sm' className='text-muted-foreground hover:text-foreground hover:bg-secondary' title='Tải xuống'>
                    <DownloadIcon size={14} />
                  </Button>
                </a>
              }
            />
          </DialogHeader>

          <div className='flex-1 flex items-center justify-center p-6 overflow-hidden relative'>
            {!loaded && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <Loader2Icon size={32} className='animate-spin text-white/40' />
              </div>
            )}
            <video src={attachment.url} controls autoPlay onCanPlay={() => setLoaded(true)} className={`max-w-full max-h-full rounded-sm transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
