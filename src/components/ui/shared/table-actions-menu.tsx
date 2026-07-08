'use client';
import { MoreHorizontal, PencilIcon, Trash2Icon, EyeIcon, ExternalLinkIcon, CopyIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TableAction {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onClick: () => void;
}

interface TableActionsMenuProps {
  actions: TableAction[];
  className?: string;
  triggerClassName?: string;
}

export function TableActionsMenu({ actions, className, triggerClassName }: TableActionsMenuProps) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon-xs'
          className={cn('text-muted-foreground hover:text-foreground', triggerClassName)}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={13} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className={cn('min-w-40', className)}>
        {actions.map((action, i) =>
          action.label === 'separator' ? (
            <DropdownMenuSeparator key={`sep-${i}`} />
          ) : (
            <DropdownMenuItem
              key={action.label + i}
              variant={action.variant ?? 'default'}
              disabled={action.disabled}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                action.variant === 'destructive' && 'text-red-500 focus:text-red-500 focus:bg-red-500/10',
              )}
            >
              {action.icon && <span className='mr-2 shrink-0'>{action.icon}</span>}
              <span className='flex-1'>{action.label}</span>
              {action.shortcut && (
                <span className='ml-2 text-[11px] text-muted-foreground tracking-wide'>{action.shortcut}</span>
              )}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Pre-built action factories ─────────────────────────────────────────────────

export function editAction(onClick: () => void, disabled?: boolean): TableAction {
  return { label: 'Chỉnh sửa', icon: <PencilIcon size={13} />, shortcut: '⌘E', onClick, disabled };
}

export function deleteAction(onClick: () => void, disabled?: boolean): TableAction {
  return { label: 'Xóa', icon: <Trash2Icon size={13} />, shortcut: '⌘⌫', variant: 'destructive', onClick, disabled };
}

export function viewAction(onClick: () => void, disabled?: boolean): TableAction {
  return { label: 'Xem chi tiết', icon: <EyeIcon size={13} />, shortcut: '⌘↵', onClick, disabled };
}

export function openLinkAction(onClick: () => void): TableAction {
  return { label: 'Mở link', icon: <ExternalLinkIcon size={13} />, onClick };
}

export function copyAction(onClick: () => void): TableAction {
  return { label: 'Sao chép', icon: <CopyIcon size={13} />, onClick };
}

export function updateRoleAction(onClick: () => void, disabled?: boolean): TableAction {
  return { label: 'Cập nhật vai trò', icon: <PencilIcon size={13} />, shortcut: '⌘R', onClick, disabled };
}

export function separator(): TableAction {
  return { label: 'separator', onClick: () => {} };
}
