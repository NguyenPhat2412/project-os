/**
 * Shared Kanban types — used by KanbanView, KanbanColumn, KanbanCard
 * Generic enough to cover Tasks, Bugs, or any entity with status columns.
 */

import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

export type Priority = 'High' | 'Normal' | 'Low';

export type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

export const priorityVariantMap: Record<Priority, BadgeVariant> = {
  High: TASK_PRIORITY_META.High.badgeVariant,
  Normal: TASK_PRIORITY_META.Normal.badgeVariant,
  Low: TASK_PRIORITY_META.Low.badgeVariant,
};

// ── Kanban card ──────────────────────────────────────────────────────────────

/** Display-only fields — id is always sourced from the item, not from the mapper */
export type KanbanCardDisplayFields = Omit<KanbanCardProps, 'id' | 'draggable' | 'onDragStart' | 'onDragEnd' | 'onDragOver' | 'onDrop' | 'showDropIndicator'>;

export interface KanbanCardProps {
  id: string;
  /** Short label shown top-left (e.g. "TASK-01", "BUG-03") */
  tag?: string;
  category?: string;
  title: string;
  priority: Priority;
  points?: number;
  /** Avatar initials + color — callers map their own fields */
  assigneeInitials?: string;
  assigneeColor?: string;
  assigneePhotoURL?: string;
  progress?: number;
  faded?: boolean;
  onClick?: () => void;
  /** Item type icon — rendered as ReactNode (typically a Lucide icon). Defaults to nothing if omitted. */
  itemTypeIcon?: React.ReactNode;
  // Drag-and-drop — injected by KanbanView, NOT part of display contract
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  showDropIndicator?: boolean;
}

// ── Kanban column ────────────────────────────────────────────────────────────

export interface KanbanColumnProps {
  title: string;
  color: string;
  cards: KanbanCardProps[];
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
  isDragOver?: boolean;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  showDropAtEndIndicator?: boolean;
  onDeleteColumn?: () => void;
  onEditColumn?: () => void;
}

// ── Kanban board ─────────────────────────────────────────────────────────────

/** Minimal column descriptor — callers pass KanbanBoardColumn[] but can pass TaskColumn[] (extends it) */
export interface KanbanBoardColumn {
  id: string;
  title: string;
  color: string;
}

export interface KanbanBoardProps<T extends { id: string; status: string }> {
  /** Ordered list of columns to render */
  columns: KanbanBoardColumn[];
  /** All items to distribute across columns */
  items: T[];
  /**
   * Extract display fields from an item.
   * Return type MUST NOT include `id` — KanbanView sources id from the item itself.
   */
  itemMapper: (item: T) => KanbanCardDisplayFields;
  /** Called when a card is clicked */
  onItemClick?: (item: T) => void;
  /** Called when the "+ Thêm" button on the first column is clicked */
  onCreateItem?: (columnId: string) => void;
  /**
   * Called when an item is dropped onto a column or between cards.
   * `toColumnId` = target column id.
   * `beforeItemId` = item id to insert before, or undefined = append at end.
   */
  onMoveItem?: (itemId: string, toColumnId: string, beforeItemId?: string) => Promise<void>;
  /** Column label shown on the "+ Thêm" button */
  createItemLabel?: string;
  /** Enable column CRUD (edit/delete icons appear on hover) */
  columnEditable?: boolean;
  onDeleteColumn?: (columnId: string) => void;
  /**
   * Called when the edit-column button is clicked.
   * Passes the column as received from `columns` prop.
   * Callers narrow the type via `as TaskColumn` or `as BugColumn`.
   */
  onEditColumn?: (column: KanbanBoardColumn) => void;
  /** Resolve item status field name (default: 'status') */
  statusField?: keyof T & string;
}
