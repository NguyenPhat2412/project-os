'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState, type Column } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { UserAvatar } from '@/components/shared/user-avatar';
import { PageBadge } from '@/components/ui/page-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TableActionsMenu, updateRoleAction, deleteAction, viewAction } from '@/components/ui/shared/table-actions-menu';
import type { TeamMember } from '@/modules/team/types/team';

const statusVariant: Record<string, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  Active: 'green',
  Overloaded: 'red',
  Busy: 'yellow',
  Vacant: 'muted',
};

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';
const PINNED_LEFT = ['member'] as const;
const columnHelper = createColumnHelper<TeamMember>();

function getStickyHeaderClass(col: Column<TeamMember>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-20 bg-card${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyCell(col: Column<TeamMember>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-10 bg-card group-hover:bg-secondary transition-colors${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyStyle(col: Column<TeamMember>): React.CSSProperties | undefined {
  return col.getIsPinned() === 'left' ? { left: `${col.getStart('left')}px` } : undefined;
}

interface Props {
  members: TeamMember[];
  disabled?: boolean;
  onView?: (member: TeamMember) => void;
  onUpdateRole: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

export function TeamMembersTable({ members, disabled, onView, onUpdateRole, onDelete }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => members, [members]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'member',
        header: 'Thành viên',
        size: 220,
        enableSorting: false,
        cell: (info) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(info.row.original);
            }}
            className='flex items-center gap-3 text-left w-full hover:opacity-80 transition-opacity'
          >
            <UserAvatar user={info.row.original} size='md' />
            <span className='text-[13.5px] font-semibold whitespace-nowrap text-foreground'>{info.row.original.name}</span>
          </button>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('roles', {
        header: 'Vai trò',
        enableSorting: false,
        cell: (info) => <span className='text-[12.5px] whitespace-nowrap'>{info.getValue()?.join(', ')}</span>,
      }),
      columnHelper.accessor('taskCount', {
        header: 'Tasks',
        cell: (info) => <span className='font-mono-dm text-[13px] font-bold'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('workload', {
        header: 'Workload',
        cell: (info) => {
          const v = info.getValue() ?? 0;
          return (
            <div className='min-w-35'>
              <ProgressBar label={`${v}%`} value={v} noMargin color={v >= 90 ? 'oklch(0.577 0.245 27.325)' : v >= 75 ? 'oklch(0.769 0.188 70.08)' : 'oklch(0.646 0.222 142.116)'} />
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (info) => <PageBadge variant={statusVariant[info.getValue()] ?? 'muted'}>{info.getValue()}</PageBadge>,
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => {
          const actions = [updateRoleAction(() => onUpdateRole(info.row.original), disabled)];
          if (onView) actions.push(viewAction(() => onView(info.row.original), disabled));
          actions.push(deleteAction(() => onDelete(info.row.original), disabled, 'Vô hiệu hóa'));
          return (
            <div className='flex items-center justify-end'>
              <TableActionsMenu actions={actions} />
            </div>
          );
        },
      }),
    ],
    [onView, disabled, onUpdateRole, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnPinning: { left: ['member'] } },
    onSortingChange: setSorting,
  });

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
        {table.getRowModel().rows.length === 0 && (
          <TableRow className='border-border hover:bg-transparent'>
            <TableCell colSpan={7} className='py-12 text-center text-[13px] text-muted-foreground'>
              Chưa có thành viên nào. Nhấn &quot;Thêm nhân sự&quot; để bắt đầu.
            </TableCell>
          </TableRow>
        )}
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className={getStickyCell(cell.column, 'py-3 px-3')} style={getStickyStyle(cell.column)}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
