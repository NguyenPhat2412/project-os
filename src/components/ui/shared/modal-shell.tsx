'use client';

import { SaveIcon, Trash2Icon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalShellSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const MODAL_MAX_WIDTH_BY_SIZE: Record<ModalShellSize, string> = {
  xs: 'max-w-[360px]',
  sm: 'max-w-[480px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[720px]',
  '2xl': 'max-w-[920px]',
};

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  /** Preset modal width. Ignored if `maxWidth` is provided. */
  size?: ModalShellSize;
  /** Tailwind max-width class override, e.g. 'max-w-[480px]' */
  maxWidth?: string;
  className?: string;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  submitLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  deleteLabel?: React.ReactNode;
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
  deleteDisabled?: boolean;
  closeDisabled?: boolean;
  submitLoading?: boolean;
  submitLoadingLabel?: React.ReactNode;
  submitDanger?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  headerClassName?: string;
  footerClassName?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

type DialogSectionProps = React.ComponentProps<'div'>;

type DialogTextProps = React.ComponentProps<'h2'>;

type DialogDescriptionProps = React.ComponentProps<'p'>;

type DialogBodyProps = React.ComponentProps<'div'>;

interface ModalHeaderBarProps extends React.ComponentProps<'div'> {
  heading: React.ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  titleClassName?: string;
}

type DeleteButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant'> & {
  icon?: React.ReactNode;
};

type SubmitButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant'> & {
  icon?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: React.ReactNode;
};

type CancelButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant'> & {
  icon?: React.ReactNode;
};

export function DialogHeader({ className, ...props }: DialogSectionProps) {
  return <div className={cn('sticky top-0 z-10 px-6 py-4 border-b border-border bg-card flex flex-col gap-1.5', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: DialogTextProps) {
  return <h2 className={cn('font-sans text-[15px] font-bold text-foreground', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn('text-[12px] text-muted-foreground leading-relaxed', className)} {...props} />;
}

export function DialogBody({ className, ...props }: DialogBodyProps) {
  return <div className={cn('px-6 py-4 overflow-y-auto', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: DialogSectionProps) {
  return <div className={cn('sticky bottom-0 z-10 px-6 py-4 border-t border-border bg-card flex items-center justify-end gap-2', className)} {...props} />;
}

export function ModalHeaderBar({ className, heading, onClose, closeDisabled, actions, leading, titleClassName, ...props }: ModalHeaderBarProps) {
  return (
    <div className={cn('flex items-center gap-2 w-full', className)} {...props}>
      {leading}
      <DialogTitle className={cn('flex-1 min-w-0', titleClassName)}>{heading}</DialogTitle>
      <div className='flex items-center gap-2'>
        {actions}
        <Button type='button' variant='ghost' size='icon-sm' onClick={onClose} disabled={closeDisabled} className='text-muted-foreground hover:text-foreground hover:bg-secondary'>
          <XIcon size={15} />
        </Button>
      </div>
    </div>
  );
}

export function DeleteButton({ className, icon, children = 'Xóa', ...props }: DeleteButtonProps) {
  return (
    <Button type='button' variant='destructive' className={cn('h-9 gap-1.5', className)} {...props}>
      {icon ?? <Trash2Icon size={14} />}
      {children}
    </Button>
  );
}

export function SubmitButton({ className, icon, loading, loadingLabel = 'Đang xử lý...', children = 'Lưu', ...props }: SubmitButtonProps) {
  return (
    <Button type='button' className={cn('h-9 flex items-center justify-center gap-2', className)} {...props}>
      {loading ? (
        <>
          <span className='w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon ?? <SaveIcon size={14} />}
          {children}
        </>
      )}
    </Button>
  );
}

export function CancelButton({ className, icon, children = 'Đóng', ...props }: CancelButtonProps) {
  return (
    <Button type='button' variant='outline' className={cn('h-9.5 border-border text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-foreground/20', className)} {...props}>
      {icon}
      {children}
    </Button>
  );
}

export function ModalShell({
  open,
  size = 'lg',
  maxWidth,
  className,
  title,
  icon,
  onSubmit,
  onCancel,
  onDelete,
  onClose,
  submitLabel = 'Lưu',
  cancelLabel = 'Đóng',
  deleteLabel = 'Xóa',
  submitDisabled,
  cancelDisabled,
  deleteDisabled,
  closeDisabled,
  submitLoading,
  submitLoadingLabel = 'Đang xử lý...',
  submitDanger,
  header,
  footer,
  headerClassName,
  footerClassName,
  bodyClassName,
  children,
}: ModalShellProps) {
  const resolvedMaxWidth = maxWidth ?? MODAL_MAX_WIDTH_BY_SIZE[size];
  const computedHeader = header ?? (title || icon ? <ModalHeaderBar onClose={onClose} closeDisabled={closeDisabled} heading={title} leading={icon} /> : null);
  const computedFooter =
    footer ??
    (onSubmit || onCancel || onDelete ? (
      <div className='flex w-full items-center gap-2'>
        {onDelete ? (
          <DeleteButton onClick={onDelete} disabled={deleteDisabled}>
            {deleteLabel}
          </DeleteButton>
        ) : null}
        <div className='flex-1' />
        {onCancel ? (
          <CancelButton onClick={onCancel} disabled={cancelDisabled}>
            {cancelLabel}
          </CancelButton>
        ) : null}
        {onSubmit ? (
          <SubmitButton onClick={onSubmit} disabled={submitDisabled} loading={submitLoading} loadingLabel={submitLoadingLabel} className={submitDanger ? 'bg-red-500' : undefined}>
            {submitLabel}
          </SubmitButton>
        ) : null}
      </div>
    ) : null);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {/* Dark OS-theme backdrop */}
        <DialogOverlay className='bg-black/75 duration-150' />

        {/* Modal popup */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            'bg-card border border-border panel-modal overflow-hidden max-h-[90vh] outline-none flex flex-col',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 duration-150',
            resolvedMaxWidth,
            className,
          )}
        >
          <VisuallyHidden asChild>
            <DialogPrimitive.Title>{typeof title === 'string' ? title : 'Dialog'}</DialogPrimitive.Title>
          </VisuallyHidden>
          {computedHeader ? <DialogHeader className={headerClassName}>{computedHeader}</DialogHeader> : null}
          <div className={cn('flex-1 overflow-y-auto', bodyClassName)}>{children}</div>
          {computedFooter ? <DialogFooter className={footerClassName}>{computedFooter}</DialogFooter> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
