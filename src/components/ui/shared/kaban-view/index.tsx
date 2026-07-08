'use client';
/**
 * KanbanView
 * ───────────
 * Generic kanban board — fully agnostic of data type.
 * Callers provide `itemMapper` to extract display fields and handle
 * status via `onMoveItem`. Used by Tasks, Bugs, or any entity with columns.
 */
import { useState } from 'react';
import { KanbanColumn } from './kanban-column';
import type { KanbanBoardProps, KanbanCardProps } from './types';

type Props<T extends { id: string; status: string }> = KanbanBoardProps<T>;

export function KanbanView<T extends { id: string; status: string }>({
  columns,
  items,
  itemMapper,
  onItemClick,
  onCreateItem,
  onMoveItem,
  createItemLabel = '+ Thêm',
  columnEditable,
  onDeleteColumn,
  onEditColumn,
  statusField = 'status' as keyof T & string,
}: Props<T>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dropBeforeId, setDropBeforeId] = useState<string | null>(null);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (itemId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    setDraggingId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumnId(null);
    setDropBeforeId(null);
  };

  const handleCardDragOver = (colId: string, itemId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingId && draggingId !== itemId) {
      setDragOverColumnId(colId);
      setDropBeforeId(itemId);
    }
  };

  const handleCardDrop = (colId: string, itemId: string) => async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await onMoveItem(draggingId!, colId, itemId);
    setDraggingId(null);
    setDragOverColumnId(null);
    setDropBeforeId(null);
  };

  // Dropping on empty column (no `before` item)
  const handleColumnDrop = (colId: string) => async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only fire if dropped directly on the column background (not a card)
    await onMoveItem(draggingId!, colId);
    setDraggingId(null);
    setDragOverColumnId(null);
    setDropBeforeId(null);
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (e.target === e.currentTarget) setDropBeforeId(null);
  };

  const handleColumnDragEnter = (colId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingId) {
      setDragOverColumnId(colId);
      if (e.target === e.currentTarget) setDropBeforeId(null);
    }
  };

  const handleColumnDragLeave = (colId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(next)) {
      setDragOverColumnId((c) => (c === colId ? null : c));
      setDropBeforeId(null);
    }
  };

  // ── Render columns ──────────────────────────────────────────────────────────
  return (
    <div className='grid gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1' style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))` }}>
      {columns.map((col, index) => {
        const colItems = items.filter((item) => String(item[statusField]) === col.id).sort((a, b) => (a as unknown as { order?: number }).order ?? 0 - ((b as unknown as { order?: number }).order ?? 0));

        const cards: KanbanCardProps[] = colItems.map((item) => {
          const { id } = item;
          return {
            ...itemMapper(item), // display fields always win (may include title/priority/etc.)
            id, // KanbanView sources id from the item itself
            onClick: onItemClick ? () => onItemClick(item) : undefined,
            draggable: true,
            onDragStart: handleDragStart(item.id),
            onDragEnd: handleDragEnd,
            onDragOver: handleCardDragOver(col.id, item.id),
            onDrop: handleCardDrop(col.id, item.id),
            showDropIndicator: Boolean(draggingId && draggingId !== item.id && dropBeforeId === item.id),
          };
        });

        const showDropAtEnd = Boolean(draggingId && dragOverColumnId === col.id && dropBeforeId === null);

        return (
          <KanbanColumn
            key={col.id}
            title={col.title}
            color={col.color}
            cards={cards}
            showAddButton={onCreateItem ? index === 0 : undefined}
            onAddClick={onCreateItem ? () => onCreateItem(col.id) : undefined}
            addButtonLabel={createItemLabel}
            isDragOver={dragOverColumnId === col.id}
            showDropAtEndIndicator={showDropAtEnd}
            onDragOver={handleColumnDragOver}
            onDragEnter={handleColumnDragEnter(col.id)}
            onDragLeave={handleColumnDragLeave(col.id)}
            onDrop={handleColumnDrop(col.id)}
            onEditColumn={columnEditable && onEditColumn ? () => onEditColumn(col) : undefined}
            onDeleteColumn={columnEditable && onDeleteColumn && index > 0 && colItems.length === 0 ? () => onDeleteColumn(col.id) : undefined}
          />
        );
      })}
    </div>
  );
}
