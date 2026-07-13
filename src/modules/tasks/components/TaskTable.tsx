'use client';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { Fragment, useMemo, useRef, useState } from 'react';

import { UserAvatar } from '@/components/shared/user-avatar';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { PageBadge } from '@/components/ui/page-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupSectionHeader } from '@/components/ui/shared/group-section-header';
import { deleteAction, editAction, TableActionsMenu, viewAction } from '@/components/ui/shared/table-actions-menu';
import { Spinner } from '@/components/ui/spinner';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TASK_PRIORITY_META, WorkItemBadgeVariant } from '@/lib/constants/work-item-colors';
import { formatDateVi } from '@/lib/dayjs';
import { deleteField } from '@/lib/api-rq';
import { cn } from '@/lib/utils';
import { groupItems } from '@/lib/utils/group-items';
import { getTaskColumnBadgeVariant, getTaskColumnLabel, isTaskDoneStatus } from '@/modules/tasks/utils/taskColumns';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';

import type { SortingState } from '@tanstack/react-table';
import type { Task, Priority, TaskColumn } from '@/modules/tasks/types/task';
import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { GroupableField } from '@/lib/types/grouping';
const roleLabel = (roles?: string[]) => roles?.[0] ?? roles?.join(', ');

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Normal: 1, Low: 2 };
const PRIORITY_VARIANT: Record<Priority, WorkItemBadgeVariant> = {
  High: TASK_PRIORITY_META.High.badgeVariant,
  Normal: TASK_PRIORITY_META.Normal.badgeVariant,
  Low: TASK_PRIORITY_META.Low.badgeVariant,
};

function parseDate(ddmmyyyy: string | unknown): Date | null {
  if (!ddmmyyyy || typeof ddmmyyyy !== 'string') return null;
  const [dd, mm, yyyy] = ddmmyyyy.split('/').map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  const d = parseDate(deadline);
  return d !== null && d < new Date();
}

const columnHelper = createColumnHelper<Task>();

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-3';

type StickySide = 'left' | 'right';
interface StickyMeta {
  sticky?: StickySide;
  stickyOffset?: number;
  /** Last left-sticky / first right-sticky — receives border + shadow on the inner edge */
  edge?: boolean;
}
function stickyProps(meta: unknown, variant: 'header' | 'body' = 'body', scrolled: { left: boolean; right: boolean } = { left: false, right: false }): { className: string; style: React.CSSProperties } {
  const m = (meta ?? {}) as StickyMeta;
  if (!m.sticky) return { className: '', style: {} };
  const hoverClass = variant === 'body' ? 'group-hover:bg-secondary' : '';
  const visible = m.sticky === 'left' ? scrolled.left : scrolled.right;
  const edgeClass = m.edge && visible ? (m.sticky === 'left' ? 'border-r border-border shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]' : 'border-l border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]') : '';
  return {
    className: cn('sticky z-20 bg-muted/70 transition-colors', hoverClass, edgeClass),
    style: m.sticky === 'left' ? { left: m.stickyOffset ?? 0 } : { right: m.stickyOffset ?? 0 },
  };
}

interface Props {
  tasks: Task[];
  columns: TaskColumn[];
  teamMembers: TeamMember[];
  sprints?: (Sprint & { id: string })[];
  groupBy?: string;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onViewTask?: (task: Task) => void;
  onUpdateTask?: (taskId: string, patch: Record<string, unknown>, column: string) => void;
  /** Set of task IDs currently mid-mutation */
  inlineUpdatingIds?: Set<string>;
  /** Column id currently mid-update (for per-column spinner) */
  updatingColumn?: string | null;
}

export function TaskTable({ tasks, columns, teamMembers, sprints = [], groupBy = 'none', onEditTask, onDeleteTask, onViewTask, onUpdateTask, inlineUpdatingIds = new Set(), updatingColumn = null }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ left: false, right: false });

  const data = useMemo(() => tasks, [tasks]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScroll({ left: false, right: false });
      return;
    }
    setScroll({
      left: el.scrollLeft > 0,
      right: el.scrollLeft < maxScroll - 1,
    });
  };

  const tableCols = useMemo(
    () => [
      columnHelper.accessor('id', {
        id: 'id',
        header: 'ID',
        enableSorting: false,
        size: 72,
        meta: { sticky: 'left', stickyOffset: 0 },
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('title', {
        id: 'title',
        header: 'Tiêu đề',
        enableSorting: false,
        size: 280,
        meta: { sticky: 'left', stickyOffset: 72, edge: true },
        cell: (info) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              (onViewTask ?? onEditTask)(info.row.original);
            }}
            className='text-left text-[13px] font-medium line-clamp-2 text-foreground hover:text-primary transition-colors w-full'
          >
            {info.getValue()}
          </button>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        sortingFn: (a, b) => {
          const ai = columns.findIndex((c) => c.id === a.original.status);
          const bi = columns.findIndex((c) => c.id === b.original.status);
          return ai - bi;
        },
        cell: (info) => {
          const task = info.row.original;
          const value = info.getValue();
          const isBusy = inlineUpdatingIds.has(task.id) && updatingColumn === 'status';
          if (onUpdateTask) {
            return (
              <Select value={value} onValueChange={(v) => onUpdateTask(task.id, { status: v }, 'status')} disabled={isBusy}>
                <SelectTrigger className={cn('h-6 py-0 pr-1.5 pl-1 text-[11px] border-0 bg-transparent shadow-none focus:bg-accent focus:ring-1 focus:ring-primary', isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue>{isBusy ? <Spinner size='sm' className='mr-1' /> : <PageBadge variant={getTaskColumnBadgeVariant(value, columns)}>{getTaskColumnLabel(value, columns)}</PageBadge>}</SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id} className='text-[12px]'>
                      <PageBadge variant={getTaskColumnBadgeVariant(col.id, columns)}>{col.title}</PageBadge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return <PageBadge variant={getTaskColumnBadgeVariant(value, columns)}>{getTaskColumnLabel(value, columns)}</PageBadge>;
        },
      }),
      columnHelper.accessor('priority', {
        header: 'Ưu tiên',
        sortingFn: (a, b) => PRIORITY_ORDER[a.original.priority] - PRIORITY_ORDER[b.original.priority],
        cell: (info) => <PageBadge variant={PRIORITY_VARIANT[info.getValue()]}>{info.getValue()}</PageBadge>,
      }),
      columnHelper.display({
        id: 'assignee',
        header: 'Người xử lý',
        enableSorting: false,
        cell: (info) => {
          const task = info.row.original;
          const member = teamMembers.find((m) => m.id === task.assigneeId);
          const isBusy = inlineUpdatingIds.has(task.id) && updatingColumn === 'assignee';
          if (onUpdateTask) {
            return (
              <Select value={task.assigneeId ?? '__none__'} onValueChange={(v) => onUpdateTask(task.id, v === '__none__' ? { assigneeId: undefined } : { assigneeId: v }, 'assignee')} disabled={isBusy}>
                <SelectTrigger className={cn('h-7 gap-1.5 border-0 bg-transparent shadow-none focus:bg-accent focus:ring-1 focus:ring-primary px-1.5 py-0.5 rounded-sm min-w-30', isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder='—'>
                    {isBusy ? (
                      <Spinner size='sm' />
                    ) : member ? (
                      <div className='flex items-center gap-1.5'>
                        <UserAvatar user={member} size='sm' />
                        <span className='text-[12px]'>
                          {member.displayName} ({roleLabel(member.roles)})
                        </span>
                      </div>
                    ) : (
                      <span className='text-[12px] text-muted-foreground'>—</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  <SelectItem value='__none__' className='text-[12px] text-muted-foreground'>
                    — Chưa giao
                  </SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id} className='text-[12px]'>
                      <div className='flex items-center gap-1.5'>
                        <UserAvatar user={m} size='sm' />
                        <span>
                          {m.displayName} ({roleLabel(m.roles)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return member ? (
            <div className='flex items-center gap-1.5'>
              <UserAvatar user={member} size='sm' />
              <span className='text-[12px]'>
                {member.displayName} ({roleLabel(member.roles)})
              </span>
            </div>
          ) : (
            <span className='text-[12px] text-muted-foreground'>—</span>
          );
        },
      }),
      columnHelper.display({
        id: 'reporter',
        header: 'Người nhận báo cáo',
        enableSorting: false,
        cell: (info) => {
          const task = info.row.original;
          const member = teamMembers.find((m) => m.id === task.reporterId);
          const isBusy = inlineUpdatingIds.has(task.id) && updatingColumn === 'reporter';
          if (onUpdateTask) {
            return (
              <Select value={task.reporterId ?? '__none__'} onValueChange={(v) => onUpdateTask(task.id, v === '__none__' ? { reporterId: undefined } : { reporterId: v }, 'reporter')} disabled={isBusy}>
                <SelectTrigger className={cn('h-7 gap-1.5 border-0 bg-transparent shadow-none focus:bg-accent focus:ring-1 focus:ring-primary px-1.5 py-0.5 rounded-sm min-w-30', isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder='—'>
                    {isBusy ? (
                      <Spinner size='sm' />
                    ) : member ? (
                      <div className='flex items-center gap-1.5'>
                        <UserAvatar user={member} size='sm' />
                        <span className='text-[12px]'>
                          {member.displayName} ({roleLabel(member.roles)})
                        </span>
                      </div>
                    ) : (
                      <span className='text-[12px] text-muted-foreground'>—</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  <SelectItem value='__none__' className='text-[12px] text-muted-foreground'>
                    — Chưa giao
                  </SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id} className='text-[12px]'>
                      <div className='flex items-center gap-1.5'>
                        <UserAvatar user={m} size='sm' />
                        <span>
                          {m.displayName} ({roleLabel(m.roles)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return member ? (
            <div className='flex items-center gap-1.5'>
              <UserAvatar user={member} size='sm' />
              <span className='text-[12px]'>
                {member.displayName} ({roleLabel(member.roles)})
              </span>
            </div>
          ) : (
            <span className='text-[12px] text-muted-foreground'>—</span>
          );
        },
      }),
      columnHelper.accessor('deadline', {
        header: 'Hết hạn',
        sortingFn: (a, b) => {
          const da = parseDate(a.original.deadline ?? '')?.getTime() ?? Infinity;
          const db = parseDate(b.original.deadline ?? '')?.getTime() ?? Infinity;
          return da - db;
        },
        cell: (info) => {
          const task = info.row.original;
          const overdue = isOverdue(info.getValue()) && !isTaskDoneStatus(task.status, columns);
          const isBusy = inlineUpdatingIds.has(task.id) && updatingColumn === 'deadline';
          if (onUpdateTask) {
            return (
              <div className='w-41.5'>
                <DateTimePicker value={info.getValue()} disabled={isBusy} onChange={(val) => onUpdateTask(task.id, { deadline: val || deleteField() }, 'deadline')} onClear={() => onUpdateTask(task.id, { deadline: deleteField() }, 'deadline')} />
              </div>
            );
          }
          return (
            <span className={`text-[12px] ${overdue ? 'text-red-400 font-semibold' : 'text-muted-foreground'}`}>
              {info.getValue()
                ? (() => {
                    const [d, t] = info.getValue()!.split(',');
                    return t ? `${formatDateVi(d, 'DD/MM/YYYY')} ${t}` : formatDateVi(d, 'DD/MM/YYYY');
                  })()
                : '—'}
            </span>
          );
        },
      }),
      columnHelper.accessor('completedAt', {
        header: 'Hoàn thành',
        enableSorting: false,
        cell: (info) => <span className='text-[12px] text-muted-foreground'>{info.getValue() ? formatDateVi(info.getValue()!, 'DD/MM/YYYY') : '—'}</span>,
      }),

      columnHelper.accessor('points', {
        header: 'Điểm',
        enableSorting: false,
        cell: (info) => {
          const task = info.row.original;
          const isBusy = inlineUpdatingIds.has(task.id) && updatingColumn === 'points';
          if (onUpdateTask) {
            const value = info.getValue();
            return (
              <Select value={value !== undefined ? String(value) : '__none__'} onValueChange={(v) => onUpdateTask(task.id, { points: v === '__none__' ? undefined : Number(v) }, 'points')} disabled={isBusy}>
                <SelectTrigger className={cn('h-7 w-14 border-0 bg-transparent shadow-none focus:bg-accent focus:ring-1 focus:ring-primary px-1.5 py-0.5 rounded-sm justify-center', isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder='—'>{value !== undefined ? <span className='font-mono-dm text-[12px]'>{String(value).padStart(2, '0')}</span> : <span className='text-[12px] text-muted-foreground'>—</span>}</SelectValue>
                </SelectTrigger>
                <SelectContent side='top' align='center'>
                  <SelectItem value='__none__' className='text-[12px] text-muted-foreground justify-center'>
                    —
                  </SelectItem>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((pt) => (
                    <SelectItem key={pt} value={String(pt)} className='text-[12px] justify-center'>
                      {String(pt).padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return <span className='font-mono-dm text-[12px] text-muted-foreground'>{info.getValue() !== undefined ? String(info.getValue()).padStart(2, '0') : '—'}</span>;
        },
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        size: 48,
        meta: { sticky: 'right', stickyOffset: 0, edge: true },
        cell: (info) => {
          const actions = [editAction(() => onEditTask(info.row.original))];
          if (onViewTask) actions.push(viewAction(() => onViewTask(info.row.original)));
          if (onDeleteTask) actions.push(deleteAction(() => onDeleteTask(info.row.original)));
          return (
            <div className='flex items-center justify-end'>
              <TableActionsMenu actions={actions} />
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onUpdateTask is a stable callback
    [columns, teamMembers, onEditTask, onDeleteTask],
  );

  const table = useReactTable({
    data,
    columns: tableCols,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  // Build groupable fields config for tasks
  const taskGroupableFields = useMemo((): Record<string, GroupableField<Task>> => {
    const statusOrderMap = Object.fromEntries(columns.map((c, i) => [c.id, i]));
    const memberMap = new Map(teamMembers.map((m) => [m.id, m.name]));
    const sprintMap = new Map(sprints.map((s) => [s.id, s.name]));
    const sprintOrderMap = Object.fromEntries(sprints.map((s, i) => [s.id, i]));

    return {
      status: {
        id: 'status',
        label: 'Trạng thái',
        accessor: (t) => t.status,
        labelResolver: (key) => columns.find((c) => c.id === key)?.title ?? key,
        orderMap: statusOrderMap,
      },
      priority: {
        id: 'priority',
        label: 'Ưu tiên',
        accessor: (t) => t.priority,
        orderMap: PRIORITY_ORDER,
      },
      assignee: {
        id: 'assignee',
        label: 'Người xử lý',
        accessor: (t) => t.assigneeId,
        labelResolver: (key) => memberMap.get(key) ?? key,
      },
      sprint: {
        id: 'sprint',
        label: 'Sprint',
        accessor: (t) => t.sprintId,
        labelResolver: (key) => sprintMap.get(key) ?? key,
        orderMap: sprintOrderMap,
      },
    };
  }, [columns, teamMembers, sprints]);

  // Build a row lookup map for grouped rendering (O(n) build, O(1) lookup)
  const rowById = useMemo(() => {
    const map = new Map(table.getRowModel().rows.map((r) => [r.original.id, r]));
    return map;
  }, [table]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (tasks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground'>
        <span className='text-[40px] opacity-30'>✅</span>
        <p className='text-[13px]'>Không có task nào. Tạo task mới để bắt đầu!</p>
      </div>
    );
  }

  const colCount = tableCols.length;
  const activeField = groupBy !== 'none' ? taskGroupableFields[groupBy] : null;
  const groups = activeField ? groupItems(tasks, activeField) : null;

  return (
    <div ref={scrollRef} onScroll={handleScroll} className='overflow-x-auto'>
      <table className='w-full caption-bottom text-sm'>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className='border-border hover:bg-transparent'>
              {hg.headers.map((h) => {
                const sorted = h.column.getIsSorted();
                const sp = stickyProps(h.column.columnDef.meta, 'header', scroll);
                return (
                  <TableHead key={h.id} className={cn(TH_CLASS, sp.className)} style={{ ...sp.style, cursor: h.column.getCanSort() ? 'pointer' : 'default' }}>
                    {h.column.getCanSort() ? (
                      <div className='flex items-center gap-1 select-none'>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === 'asc' ? <ChevronUp size={11} /> : sorted === 'desc' ? <ChevronDown size={11} /> : <ChevronsUpDown size={11} className='opacity-40' />}
                      </div>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {groups
            ? // Grouped rendering
              groups.map((group) => (
                <Fragment key={group.key}>
                  <GroupSectionHeader label={group.label} count={group.items.length} collapsed={collapsedGroups.has(group.key)} onToggle={() => toggleGroup(group.key)} colSpan={colCount} />
                  {!collapsedGroups.has(group.key) &&
                    group.items.map((item) => {
                      const row = rowById.get(item.id);
                      if (!row) return null;
                      return (
                        <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
                          {row.getVisibleCells().map((cell) => {
                            const sp = stickyProps(cell.column.columnDef.meta, 'body', scroll);
                            return (
                              <TableCell key={cell.id} className={cn('py-3 px-3', sp.className)} style={sp.style}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                </Fragment>
              ))
            : // Flat rendering (default)
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
                  {row.getVisibleCells().map((cell) => {
                    const sp = stickyProps(cell.column.columnDef.meta, 'body', scroll);
                    return (
                      <TableCell key={cell.id} className={cn('py-3 px-3', sp.className)} style={sp.style}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
        </TableBody>
      </table>
    </div>
  );
}
