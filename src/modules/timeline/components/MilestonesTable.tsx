'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState, type Column } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TableActionsMenu, editAction, deleteAction } from '@/components/ui/shared/table-actions-menu';
import type { TeamMember } from '@/modules/team/types/team';

type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

const statusVariant: Record<string, BadgeVariant> = {
  'Hoàn thành': 'green',
  'Đang thực hiện': 'accent',
  'Chưa bắt đầu': 'muted',
};

export interface Milestone {
  id: string;
  name: string;
  date: string;
  status: string;
  ownerId: string;
}

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';
const PINNED_LEFT = ['id', 'name'] as const;
const columnHelper = createColumnHelper<Milestone>();

function getStickyHeaderClass(col: Column<Milestone>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-20 bg-card${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyCell(col: Column<Milestone>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-10 bg-card group-hover:bg-secondary transition-colors${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyStyle(col: Column<Milestone>): React.CSSProperties | undefined {
  return col.getIsPinned() === 'left' ? { left: `${col.getStart('left')}px` } : undefined;
}

interface Props {
  milestones: Milestone[];
  teamMembers: TeamMember[];
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
}

export function MilestonesTable({ milestones, teamMembers, onEdit, onDelete }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => milestones, [milestones]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 80,
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-primary'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('name', {
        header: 'Milestone',
        size: 200,
        enableSorting: false,
        cell: (info) => <span className='text-[13px] font-medium'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('date', {
        header: 'Ngày',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (info) => <PageBadge variant={statusVariant[info.getValue()] ?? 'muted'}>{info.getValue()}</PageBadge>,
      }),
      columnHelper.display({
        id: 'owner',
        header: 'Owner',
        enableSorting: false,
        cell: (info) => {
          const owner = teamMembers.find((tm) => tm.id === info.row.original.ownerId);
          return owner ? (
            <div className='flex items-center gap-1.5'>
              <Avatar initials={owner.initials} gradient={owner.gradient} size='sm' />
              <span className='text-[12px]'>{owner.name}</span>
            </div>
          ) : (
            <span className='text-[12px] text-muted-foreground'>—</span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => {
          const actions: ReturnType<typeof editAction>[] = [];
          if (onEdit) actions.push(editAction(() => onEdit(info.row.original)));
          if (onDelete) actions.push(deleteAction(() => onDelete(info.row.original)));
          return (
            <div className='flex items-center justify-end'>
              <TableActionsMenu actions={actions} />
            </div>
          );
        },
      }),
    ],
    [teamMembers, onEdit, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnPinning: { left: ['id', 'name'] } },
    onSortingChange: setSorting,
  });

  return (
    <div className='bg-card border border-border panel p-5'>
      <div className='font-sans text-[16px] font-bold mb-4'>Milestones</div>
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
              <TableCell colSpan={6} className='py-10 text-center text-[13px] text-muted-foreground'>
                Chưa có milestone nào.
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={getStickyCell(cell.column, 'py-2.75 px-3')} style={getStickyStyle(cell.column)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
