'use client';
import { Fragment, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState, type Column } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { GroupSectionHeader } from '@/components/ui/shared/group-section-header';
import { TableActionsMenu, editAction, deleteAction, viewAction } from '@/components/ui/shared/table-actions-menu';
import { groupItems } from '@/lib/utils/group-items';
import { cn } from '@/lib/utils';
import { formatDateVi } from '@/lib/dayjs';
import { deleteField } from '@/lib/api-rq';
import type { Bug, BugSeverity, BugColumn } from '@/modules/bugs/types/bug';
import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { GroupableField } from '@/lib/types/grouping';
import { BUG_SEVERITY_META, BUG_SEVERITY_VALUES } from '@/lib/constants/work-item-colors';

type BugWithId = Bug & { id: string };
type InlineUpdate = (id: string, patch: Record<string, unknown>, column: string) => void;

const SEVERITY_ORDER: Record<BugSeverity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const severityVariant: Record<BugSeverity, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  Critical: BUG_SEVERITY_META.Critical.badgeVariant,
  High: BUG_SEVERITY_META.High.badgeVariant,
  Medium: BUG_SEVERITY_META.Medium.badgeVariant,
  Low: BUG_SEVERITY_META.Low.badgeVariant,
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

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-4';
const PINNED_LEFT = ['id', 'title'] as const;
const columnHelper = createColumnHelper<BugWithId>();

function getStickyHeaderClass(col: Column<BugWithId>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-20 bg-card${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyCell(col: Column<BugWithId>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-10 bg-card group-hover:bg-secondary transition-colors${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyStyle(col: Column<BugWithId>): React.CSSProperties | undefined {
  return col.getIsPinned() === 'left' ? { left: `${col.getStart('left')}px` } : undefined;
}

interface Props {
  bugs: BugWithId[];
  teamMembers: TeamMember[];
  columns: BugColumn[];
  sprints: (Sprint & { id: string })[];
  groupBy?: string;
  onEdit: (bug: BugWithId) => void;
  onDelete: (bug: BugWithId) => void;
  onView: (bug: BugWithId) => void;
  onUpdate?: InlineUpdate;
  inlineUpdatingIds?: Set<string>;
  updatingColumn?: string | null;
}

export function BugTable({ bugs, teamMembers, columns, sprints, groupBy = 'none', onEdit, onDelete, onView, onUpdate, inlineUpdatingIds = new Set(), updatingColumn = null }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const data = useMemo(() => bugs, [bugs]);

  const statusVariant = useMemo(() => {
    const map: Record<string, 'red' | 'accent' | 'yellow' | 'green' | 'muted'> = {};
    for (const col of columns) {
      if (col.title.match(/open/i)) map[col.id] = 'red';
      else if (col.title.match(/progress/i)) map[col.id] = 'accent';
      else if (col.title.match(/review/i)) map[col.id] = 'yellow';
      else if (col.title.match(/fixed|done|complete/i)) map[col.id] = 'green';
      else map[col.id] = 'muted';
    }
    return map;
  }, [columns]);

  const statusLabel = useMemo(() => Object.fromEntries(columns.map((c) => [c.id, c.title])), [columns]);
  const statusOrder = useMemo(() => Object.fromEntries(columns.map((c, i) => [c.id, i])), [columns]);

  const TRIGGER_CLASS = 'h-6 py-0 pr-1.5 pl-1 text-[11px] border-0 bg-transparent shadow-none focus:bg-secondary focus:ring-1 focus:ring-primary';
  const TRIGGER_MEMBER_CLASS = 'h-7 gap-1.5 border-0 bg-transparent shadow-none focus:bg-secondary focus:ring-1 focus:ring-primary px-1.5 py-0.5 rounded-sm min-w-30';

  const tableColumns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 80,
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-red-500 whitespace-nowrap'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('title', {
        header: 'Tiêu đề',
        size: 240,
        enableSorting: false,
        cell: (info) => {
          const s = info.row.original.status;
          const done = statusLabel[s]?.match(/fixed|done|complete|won/i);
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(info.row.original);
              }}
              className={`text-left text-[13px] line-clamp-2 ${done ? 'line-through text-muted-foreground' : 'text-foreground hover:text-primary'} transition-colors`}
            >
              {info.getValue()}
            </button>
          );
        },
      }),
      columnHelper.accessor('severity', {
        header: 'Mức độ',
        sortingFn: (a, b) => SEVERITY_ORDER[a.original.severity] - SEVERITY_ORDER[b.original.severity],
        cell: (info) => {
          const bug = info.row.original;
          const value = info.getValue();
          const isBusy = inlineUpdatingIds.has(bug.id) && updatingColumn === 'severity';
          if (onUpdate) {
            return (
              <Select value={value} onValueChange={(v) => onUpdate(bug.id, { severity: v as BugSeverity }, 'severity')} disabled={isBusy}>
                <SelectTrigger className={cn(TRIGGER_CLASS, isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue>{isBusy ? <Spinner size='sm' className='mr-1' /> : <PageBadge variant={severityVariant[value]}>{value}</PageBadge>}</SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  {BUG_SEVERITY_VALUES.map((s) => (
                    <SelectItem key={s} value={s} className='text-[12px]'>
                      <PageBadge variant={severityVariant[s]}>{s}</PageBadge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return <PageBadge variant={severityVariant[value]}>{value}</PageBadge>;
        },
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        sortingFn: (a, b) => (statusOrder[a.original.status] ?? 99) - (statusOrder[b.original.status] ?? 99),
        cell: (info) => {
          const bug = info.row.original;
          const value = info.getValue();
          const isBusy = inlineUpdatingIds.has(bug.id) && updatingColumn === 'status';
          if (onUpdate) {
            return (
              <Select value={value} onValueChange={(v) => onUpdate(bug.id, { status: v as Bug['status'] }, 'status')} disabled={isBusy}>
                <SelectTrigger className={cn(TRIGGER_CLASS, isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue>{isBusy ? <Spinner size='sm' className='mr-1' /> : <PageBadge variant={statusVariant[value] ?? 'muted'}>{statusLabel[value] ?? value}</PageBadge>}</SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id} className='text-[12px]'>
                      <PageBadge variant={statusVariant[col.id] ?? 'muted'}>{col.title}</PageBadge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return <PageBadge variant={statusVariant[value] ?? 'muted'}>{statusLabel[value] ?? value}</PageBadge>;
        },
      }),

      columnHelper.display({
        id: 'assignee',
        header: 'Người xử lý',
        enableSorting: false,
        cell: (info) => {
          const bug = info.row.original;
          const member = teamMembers.find((m) => m.id === bug.assigneeId);
          const isBusy = inlineUpdatingIds.has(bug.id) && updatingColumn === 'assignee';
          if (onUpdate) {
            return (
              <Select value={bug.assigneeId ?? '__none__'} onValueChange={(v) => onUpdate(bug.id, { assigneeId: v === '__none__' ? undefined : v }, 'assignee')} disabled={isBusy}>
                <SelectTrigger className={cn(TRIGGER_MEMBER_CLASS, isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder='—'>
                    {isBusy ? (
                      <Spinner size='sm' />
                    ) : member ? (
                      <div className='flex items-center gap-1.5'>
                        <Avatar initials={member.initials} gradient={member.gradient} size='sm' />
                        <span className='text-[12px]'>{member.name}</span>
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
                        <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return member ? (
            <div className='flex items-center gap-1.5'>
              <Avatar initials={member.initials} gradient={member.gradient} size='sm' />
              <span className='text-[12px]'>{member.name}</span>
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
          const bug = info.row.original;
          const member = teamMembers.find((m) => m.id === bug.reporterId);
          const isBusy = inlineUpdatingIds.has(bug.id) && updatingColumn === 'reporter';
          if (onUpdate) {
            return (
              <Select value={bug.reporterId ?? '__none__'} onValueChange={(v) => onUpdate(bug.id, { reporterId: v === '__none__' ? undefined : v }, 'reporter')} disabled={isBusy}>
                <SelectTrigger className={cn(TRIGGER_MEMBER_CLASS, isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder='—'>
                    {isBusy ? (
                      <Spinner size='sm' />
                    ) : member ? (
                      <div className='flex items-center gap-1.5'>
                        <Avatar initials={member.initials} gradient={member.gradient} size='sm' />
                        <span className='text-[12px]'>{member.name}</span>
                      </div>
                    ) : (
                      <span className='text-[12px] text-muted-foreground'>—</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  <SelectItem value='__none__' className='text-[12px] text-muted-foreground'>
                    — Chưa chọn
                  </SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id} className='text-[12px]'>
                      <div className='flex items-center gap-1.5'>
                        <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return member ? (
            <div className='flex items-center gap-1.5'>
              <Avatar initials={member.initials} gradient={member.gradient} size='sm' />
              <span className='text-[12px]'>{member.name}</span>
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
          const bug = info.row.original;
          const overdue = isOverdue(info.getValue());
          const isBusy = inlineUpdatingIds.has(bug.id) && updatingColumn === 'deadline';
          if (onUpdate) {
            return (
              <div className='w-41.5'>
                <DateTimePicker value={info.getValue()} disabled={isBusy} onChange={(val) => onUpdate(bug.id, { deadline: val || deleteField() }, 'deadline')} onClear={() => onUpdate(bug.id, { deadline: deleteField() }, 'deadline')} />
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

      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => {
          const actions = [editAction(() => onEdit(info.row.original))];
          if (onView) actions.push(viewAction(() => onView(info.row.original)));
          actions.push(deleteAction(() => onDelete(info.row.original)));
          return (
            <div className='flex items-center justify-end'>
              <TableActionsMenu actions={actions} />
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onUpdate is a stable callback; inlineUpdatingIds/updatingColumn accessed via closure
    [teamMembers, sprints, statusVariant, statusLabel, statusOrder, onEdit, onDelete, onUpdate],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnPinning: { left: ['id', 'title'] } },
    onSortingChange: setSorting,
  });

  const bugGroupableFields = useMemo((): Record<string, GroupableField<BugWithId>> => {
    const statusOrderMap = Object.fromEntries(columns.map((c, i) => [c.id, i]));
    const memberMap = new Map(teamMembers.map((m) => [m.id, m.name]));
    const sprintMap = new Map(sprints.map((s) => [s.id, s.name]));
    const sprintOrderMap = Object.fromEntries(sprints.map((s, i) => [s.id, i]));
    return {
      status: { id: 'status', label: 'Trạng thái', accessor: (b) => b.status, labelResolver: (key) => columns.find((c) => c.id === key)?.title ?? key, orderMap: statusOrderMap },
      severity: { id: 'severity', label: 'Mức độ', accessor: (b) => b.severity, orderMap: SEVERITY_ORDER },
      assignee: { id: 'assignee', label: 'Người xử lý', accessor: (b) => b.assigneeId, labelResolver: (key) => memberMap.get(key) ?? key },
      sprint: { id: 'sprint', label: 'Sprint', accessor: (b) => b.sprintId, labelResolver: (key) => sprintMap.get(key) ?? key, orderMap: sprintOrderMap },
    };
  }, [columns, teamMembers, sprints]);

  const rowById = useMemo(() => new Map(table.getRowModel().rows.map((r) => [r.original.id, r])), [table]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (bugs.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground'>
        <span className='text-3xl'>🎉</span>
        <p className='text-[13px]'>Không có bug nào. Dự án đang rất tốt!</p>
      </div>
    );
  }

  const colCount = tableColumns.length;
  const activeField = groupBy !== 'none' ? bugGroupableFields[groupBy] : null;
  const groups = activeField ? groupItems(bugs, activeField) : null;

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id} className='border-border hover:bg-transparent'>
            {hg.headers.map((h) => {
              const sorted = h.column.getIsSorted();
              return (
                <TableHead
                  key={h.id}
                  className={getStickyHeaderClass(h.column, TH_CLASS)}
                  style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default', ...getStickyStyle(h.column) }}
                  onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
                >
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
          ? groups.map((group) => (
              <Fragment key={group.key}>
                <GroupSectionHeader label={group.label} count={group.items.length} collapsed={collapsedGroups.has(group.key)} onToggle={() => toggleGroup(group.key)} colSpan={colCount} />
                {!collapsedGroups.has(group.key) &&
                  group.items.map((item) => {
                    const row = rowById.get(item.id);
                    if (!row) return null;
                    return (
                      <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={getStickyCell(cell.column, 'py-3 px-4')} style={getStickyStyle(cell.column)}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
              </Fragment>
            ))
          : table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={getStickyCell(cell.column, 'py-3 px-4')} style={getStickyStyle(cell.column)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
