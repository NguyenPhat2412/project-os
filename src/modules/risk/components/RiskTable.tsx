'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState, type Column } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { TableActionsMenu, editAction, deleteAction, viewAction } from '@/components/ui/shared/table-actions-menu';
import { cn } from '@/lib/utils';
import { formatDateVi } from '@/lib/dayjs';
import { deleteField } from '@/lib/firestore-rq';
import type { Risk, RiskLevel } from '@/modules/risk/types/risk';
import type { TeamMember } from '@/modules/team/types/team';

type RiskWithId = Risk & { id: string };
type InlineUpdate = (id: string, patch: Record<string, unknown>, column: string) => void;

const LEVEL_ORDER: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const LEVEL_VALUES: RiskLevel[] = ['Critical', 'High', 'Medium', 'Low'];
const levelVariant: Record<RiskLevel, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  Critical: 'red', High: 'yellow', Medium: 'accent', Low: 'muted',
};

const RISK_STATUSES = ['Đang xử lý', 'Đang theo dõi', 'Đã giảm thiểu'] as const;
const statusVariant: Record<string, 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted'> = {
  'Đang xử lý': 'accent', 'Đang theo dõi': 'yellow', 'Đã giảm thiểu': 'green',
};

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';
const PINNED_LEFT = ['id', 'level', 'description'] as const;
const columnHelper = createColumnHelper<RiskWithId>();

function getStickyHeaderClass(col: Column<RiskWithId>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-20 bg-card${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyCell(col: Column<RiskWithId>, base: string): string {
  if (col.getIsPinned() !== 'left') return base;
  const isLast = col.id === PINNED_LEFT[PINNED_LEFT.length - 1];
  return `${base} sticky z-10 bg-card group-hover:bg-secondary transition-colors${isLast ? ' shadow-[1px_0_0_0_var(--border)]' : ''}`;
}

function getStickyStyle(col: Column<RiskWithId>): React.CSSProperties | undefined {
  return col.getIsPinned() === 'left' ? { left: `${col.getStart('left')}px` } : undefined;
}

interface Props {
  risks: RiskWithId[];
  teamMembers: TeamMember[];
  onEdit: (risk: RiskWithId) => void;
  onDelete: (risk: RiskWithId) => void;
  onView: (risk: RiskWithId) => void;
  onUpdate?: InlineUpdate;
  inlineUpdatingIds?: Set<string>;
  updatingColumn?: string | null;
}

export function RiskTable({ risks, teamMembers, onEdit, onDelete, onView, onUpdate, inlineUpdatingIds = new Set(), updatingColumn = null }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => risks, [risks]);

  const TRIGGER_CLASS = 'h-6 py-0 pr-1.5 pl-1 text-[11px] border-0 bg-transparent shadow-none focus:bg-secondary focus:ring-1 focus:ring-primary';
  const TRIGGER_MEMBER_CLASS = 'h-7 gap-1.5 border-0 bg-transparent shadow-none focus:bg-secondary focus:ring-1 focus:ring-primary px-1.5 py-0.5 rounded-sm min-w-30';

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 80,
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-primary whitespace-nowrap'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('level', {
        header: 'Mức độ',
        size: 100,
        sortingFn: (a, b) => LEVEL_ORDER[a.original.level] - LEVEL_ORDER[b.original.level],
        cell: (info) => {
          const risk = info.row.original;
          const value = info.getValue();
          const isBusy = inlineUpdatingIds.has(risk.id) && updatingColumn === 'level';
          if (onUpdate) {
            return (
              <Select value={value} onValueChange={(v) => onUpdate(risk.id, { level: v as RiskLevel }, 'level')} disabled={isBusy}>
                <SelectTrigger className={cn(TRIGGER_CLASS, isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue>
                    {isBusy ? <Spinner size='sm' className='mr-1' /> : <PageBadge variant={levelVariant[value]}>{value}</PageBadge>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  {LEVEL_VALUES.map((l) => (
                    <SelectItem key={l} value={l} className='text-[12px]'>
                      <PageBadge variant={levelVariant[l]}>{l}</PageBadge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return <PageBadge variant={levelVariant[value]}>{value}</PageBadge>;
        },
      }),
      columnHelper.accessor('description', {
        header: 'Mô tả rủi ro',
        size: 220,
        enableSorting: false,
        cell: (info) => (
          <button
            onClick={(e) => { e.stopPropagation(); onView(info.row.original); }}
            className='text-left text-[12.5px] max-w-55 block text-foreground hover:text-primary transition-colors'
          >
            {info.getValue()}
          </button>
        ),
      }),
      columnHelper.accessor('mitigation', {
        header: 'Biện pháp',
        enableSorting: false,
        cell: (info) => <span className='text-[12px] text-muted-foreground max-w-50 block'>{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'owner',
        header: 'Owner',
        enableSorting: false,
        cell: (info) => {
          const risk = info.row.original;
          const owner = teamMembers.find((m) => m.id === risk.ownerId);
          const isBusy = inlineUpdatingIds.has(risk.id) && updatingColumn === 'owner';
          if (onUpdate) {
            return (
              <Select value={risk.ownerId ?? '__none__'} onValueChange={(v) => onUpdate(risk.id, { ownerId: v === '__none__' ? '' : v }, 'owner')} disabled={isBusy}>
                <SelectTrigger className={cn(TRIGGER_MEMBER_CLASS, isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder='—'>
                    {isBusy ? <Spinner size='sm' /> : owner ? (
                      <div className='flex items-center gap-1.5'>
                        <Avatar initials={owner.initials} gradient={owner.gradient} size='sm' />
                        <span className='text-[12px]'>{owner.name}</span>
                      </div>
                    ) : <span className='text-[12px] text-muted-foreground'>—</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
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
          return owner ? (
            <div className='flex items-center gap-1.5'>
              <Avatar initials={owner.initials} gradient={owner.gradient} size='sm' />
              <span className='text-[12px]'>{owner.name}</span>
            </div>
          ) : <span className='text-[12px] text-muted-foreground'>—</span>;
        },
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (info) => {
          const risk = info.row.original;
          const value = info.getValue();
          const isBusy = inlineUpdatingIds.has(risk.id) && updatingColumn === 'status';
          if (onUpdate) {
            return (
              <Select value={value} onValueChange={(v) => onUpdate(risk.id, { status: v }, 'status')} disabled={isBusy}>
                <SelectTrigger className={cn(TRIGGER_CLASS, isBusy && 'opacity-60')} onClick={(e) => e.stopPropagation()}>
                  <SelectValue>
                    {isBusy ? <Spinner size='sm' className='mr-1' /> : <PageBadge variant={statusVariant[value] ?? 'muted'}>{value}</PageBadge>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side='bottom' align='start'>
                  {RISK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className='text-[12px]'>
                      <PageBadge variant={statusVariant[s] ?? 'muted'}>{s}</PageBadge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return <PageBadge variant={statusVariant[value] ?? 'muted'}>{value}</PageBadge>;
        },
      }),
      columnHelper.accessor('dueDate', {
        header: 'Ngày hết hạn',
        enableSorting: false,
        cell: (info) => {
          const risk = info.row.original;
          const isBusy = inlineUpdatingIds.has(risk.id) && updatingColumn === 'dueDate';
          if (onUpdate) {
            return (
              <div className='w-33.5'>
                <DatePicker
                  value={info.getValue()}
                  disabled={isBusy}
                  onChange={(val) => onUpdate(risk.id, { dueDate: val || deleteField() }, 'dueDate')}
                  onClear={() => onUpdate(risk.id, { dueDate: deleteField() }, 'dueDate')}
                />
              </div>
            );
          }
          return <span className='text-[12px] text-muted-foreground'>{info.getValue() ? formatDateVi(info.getValue()!, 'DD/MM/YYYY') : '—'}</span>;
        },
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
    [teamMembers, onEdit, onDelete, onUpdate],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnPinning: { left: ['id', 'level', 'description'] } },
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
                <TableHead key={h.id} className={getStickyHeaderClass(h.column, TH_CLASS)} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default', ...getStickyStyle(h.column) }} onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}>
                  {h.column.getCanSort() ? (
                    <div className='flex items-center gap-1 select-none'>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {sorted === 'asc' ? <ChevronUp size={11} /> : sorted === 'desc' ? <ChevronDown size={11} /> : <ChevronsUpDown size={11} className='opacity-40' />}
                    </div>
                  ) : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 && (
          <TableRow className='border-border hover:bg-transparent'>
            <TableCell colSpan={columns.length} className='py-10 text-center text-[13px] text-muted-foreground'>
              Chưa có rủi ro nào. Nhấn &quot;Thêm rủi ro&quot; để bắt đầu.
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
