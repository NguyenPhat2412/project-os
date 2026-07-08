'use client';
/**
 * KanbanCard
 * ──────────
 * Shared kanban card — renders a single card within a KanbanColumn.
 * Props come from KanbanView (which injects drag handlers).
 */
import { UserAvatar } from '@/components/shared/user-avatar';
import { PageBadge } from '@/components/ui/page-badge';
import { priorityVariantMap } from './types';

export { priorityVariantMap };

export function KanbanCard({ tag, category, title, priority, points, assigneeInitials, assigneeColor, assigneePhotoURL, progress, faded, onClick, itemTypeIcon, draggable, onDragStart, onDragEnd, onDragOver, onDrop, showDropIndicator }: import('./types').KanbanCardProps) {
  return (
    <div
      className='relative bg-background border border-border rounded-sm px-3.25 py-3 mb-2 cursor-pointer hover:border-primary hover:-translate-y-0.5 hover:shadow-sm transition-all last:mb-0'
      style={{ opacity: faded ? 0.65 : 1 }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {showDropIndicator && <div className='pointer-events-none absolute -top-0.5 left-2 right-2 h-0.5 rounded-full bg-primary' />}
      <div className='flex items-center gap-1.5 mb-1.25'>
        {itemTypeIcon && <span className='text-muted-foreground shrink-0'>{itemTypeIcon}</span>}
        {tag && <div className='font-mono-dm text-[12px] text-muted-foreground'>{tag}</div>}
      </div>
      <div className='text-[13px] font-semibold leading-[1.4] mb-2.5'>{title}</div>
      {progress !== undefined && (
        <div className='h-1 bg-muted rounded-full overflow-hidden mb-2.5'>
          <div className='h-full bg-primary rounded-full' style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className='flex items-center gap-1.5'>
        <PageBadge variant={priorityVariantMap[priority]}>{priority}</PageBadge>
        {category && <span className='font-mono-dm text-[9.5px] text-muted-foreground bg-secondary px-1.25 py-px rounded-xs'>{category}</span>}
        <div className='ml-auto flex items-center gap-2'>
          {(assigneeInitials || assigneePhotoURL) && (
            <UserAvatar
              user={{ initials: assigneeInitials, gradient: assigneeColor, photoURL: assigneePhotoURL }}
              size='sm'
            />
          )}
          {points !== undefined && <span className='font-mono-dm text-[12px] text-muted-foreground bg-secondary px-1.5 py-px rounded-xs'>{points}pt</span>}
        </div>
      </div>
    </div>
  );
}
