import type { TaskColumn } from '@/modules/tasks/types/task';

export type TaskStatusBadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

export const DEFAULT_TASK_COLUMNS: TaskColumn[] = [
  { id: 'todo', title: 'To Do', color: '#6b7280', order: 0, progress: 0 },
  { id: 'in-progress', title: 'In Progress', color: '#6c63ff', order: 1, progress: 55 },
  { id: 'review', title: 'Review', color: '#f59e0b', order: 2, progress: 95 },
  { id: 'done', title: 'Done', color: '#22c55e', order: 3, progress: 100, isDone: true },
];

export function resolveTaskColumns(columns: TaskColumn[]): TaskColumn[] {
  if (columns.length === 0) return DEFAULT_TASK_COLUMNS;
  return [...columns].sort((a, b) => a.order - b.order);
}

export function getTaskColumn(status: string, columns: TaskColumn[]): TaskColumn | undefined {
  return resolveTaskColumns(columns).find((column) => column.id === status);
}

export function getTaskColumnLabel(status: string, columns: TaskColumn[]): string {
  return getTaskColumn(status, columns)?.title ?? status;
}

export function getTaskColumnProgress(status: string, columns: TaskColumn[]): number {
  const progress = getTaskColumn(status, columns)?.progress ?? 0;
  return Math.max(0, Math.min(100, progress));
}

export function isTaskDoneStatus(status: string, columns: TaskColumn[]): boolean {
  const column = getTaskColumn(status, columns);
  if (!column) return /done|complete|completed|closed|resolved|xong|hoàn thành/i.test(status);
  return Boolean(column.isDone) || getTaskColumnProgress(status, columns) >= 100 || /done|complete|completed|closed|resolved|xong|hoàn thành/i.test(column.title);
}

export function getTaskColumnBadgeVariant(status: string, columns: TaskColumn[]): TaskStatusBadgeVariant {
  if (isTaskDoneStatus(status, columns)) return 'green';

  const progress = getTaskColumnProgress(status, columns);
  if (progress >= 85) return 'yellow';
  if (progress >= 40) return 'accent';
  return 'muted';
}

export function slugifyTaskColumnId(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'column'
  );
}

export function createUniqueTaskColumnId(title: string, columns: TaskColumn[]): string {
  const baseId = slugifyTaskColumnId(title);
  const existingIds = new Set(columns.map((column) => column.id));

  if (!existingIds.has(baseId)) return baseId;

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}
