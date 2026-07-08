'use client';
/**
 * KanbanColumn
 * ─────────────
 * Shared kanban column — renders a vertical column with header and cards.
 * Props typed via shared KanbanView.types.
 */
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { KanbanCard } from './kanban-card';

export function KanbanColumn({
  title,
  color,
  cards,
  showAddButton,
  onAddClick,
  addButtonLabel = '+ Thêm',
  isDragOver,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  showDropAtEndIndicator,
  onDeleteColumn,
  onEditColumn,
}: import('./types').KanbanColumnProps) {
  return (
    <div
      className={['group/col bg-card border panel p-3.5 transition-colors', isDragOver ? 'border-primary' : 'border-border hover:border-foreground/20'].join(' ')}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className='flex items-center gap-2 mb-3'>
        <div className='w-2 h-2 rounded-full shrink-0' style={{ background: color }} />
        <span className='font-mono-dm text-[12px] font-medium uppercase tracking-[1.5px]'>{title}</span>
        <span className='ml-auto bg-secondary rounded-xs font-mono-dm text-[12px] px-1.75 py-px text-muted-foreground'>{cards.length}</span>
        {onEditColumn && (
          <button onClick={onEditColumn} className='opacity-0 group-hover/col:opacity-100 transition-opacity p-1 rounded-sm text-muted-foreground hover:text-primary hover:bg-primary/10' title='Sửa cột'>
            <PencilIcon size={12} />
          </button>
        )}
        {onDeleteColumn && (
          <button onClick={onDeleteColumn} className='opacity-0 group-hover/col:opacity-100 transition-opacity p-1 rounded-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10' title='Xoá cột'>
            <Trash2Icon size={12} />
          </button>
        )}
      </div>

      {cards.map((card) => (
        <KanbanCard key={card.id} {...card} />
      ))}

      {showDropAtEndIndicator && <div className='pointer-events-none mt-1 mb-2 h-0.5 rounded-full bg-primary animate-in fade-in-0 duration-150' />}

      {showAddButton && (
        <button onClick={onAddClick} className='w-full mt-2 py-2 text-[12px] text-muted-foreground border border-dashed border-foreground/20 rounded-xs hover:border-primary hover:text-primary transition-colors bg-transparent cursor-pointer'>
          {addButtonLabel}
        </button>
      )}
    </div>
  );
}
