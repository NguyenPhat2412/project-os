import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangleIcon } from 'lucide-react';
type Props = {
  title: string;
  description: string;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
};
export function DeleteDialog({ title, description, onConfirm, cancelText, confirmText }: Props) {
  return (
    <div className='flex items-center justify-center'>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant='outline'>{title}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <div className='bg-destructive/10 text-destructive rounded-full flex size-10 shrink-0 items-center justify-center'>
                <AlertTriangleIcon className='size-5' />
              </div>
              <div className='flex flex-col gap-1'>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>{cancelText || 'Cancel'}</Button>
            </DialogClose>
            <Button variant='destructive' onClick={onConfirm}>
              {confirmText || 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
