'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { DocEntry } from '@/modules/docs/collections/documents';
import { PageBadge } from '@/components/ui/page-badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TableActionsMenu, editAction, deleteAction, viewAction } from '@/components/ui/shared/table-actions-menu';
import type { WithId } from '@/lib/firestore-rq';

type DocWithId = WithId<DocEntry>;

type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';
const columnHelper = createColumnHelper<DocWithId>();

interface DocumentTableProps {
  documents: DocWithId[];
  onEdit: (doc: DocWithId) => void;
  onDelete: (doc: DocWithId) => void;
  onUpload: () => void;
  onView: (doc: DocWithId) => void;
}

export function DocumentTable({ documents, onEdit, onDelete, onUpload, onView }: DocumentTableProps) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => documents, [documents]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Tài liệu',
        enableSorting: false,
        cell: (info) => (
          <button
            onClick={(e) => { e.stopPropagation(); onView(info.row.original); }}
            className='flex items-center gap-3 text-left w-full hover:opacity-80 transition-opacity'
          >
            <div className='w-8 h-8 bg-secondary border border-border rounded-sm flex items-center justify-center text-[15px] shrink-0'>{info.row.original.icon}</div>
            <span className='text-[13.5px] font-medium whitespace-nowrap text-foreground'>{info.getValue()}</span>
          </button>
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Loại',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground uppercase whitespace-nowrap'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('date', {
        header: 'Ngày',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap'>{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'badge',
        header: 'Trạng thái',
        enableSorting: false,
        cell: (info) => <PageBadge variant={info.row.original.badge.variant as BadgeVariant}>{info.row.original.badge.label}</PageBadge>,
      }),
      columnHelper.accessor('size', {
        header: 'Kích thước',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap'>{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'attachments',
        header: 'Đính kèm',
        enableSorting: false,
        cell: (info) => {
          const count = info.row.original.attachments?.length ?? 0;
          if (count === 0) return <span className='font-mono-dm text-[12px] text-muted-foreground'>—</span>;
          return <span className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-[12px] font-mono-dm text-primary'>{count}</span>;
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
    [onEdit, onDelete, onView],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <>
      {documents.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground'>
          <span className='text-3xl'>📂</span>
          <p className='text-[13px]'>
            Chưa có tài liệu nào.{' '}
            <button onClick={onUpload} className='text-primary hover:underline'>
              Upload ngay
            </button>
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className='border-border hover:bg-transparent'>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} className={TH_CLASS} onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors group'>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className='py-3 px-3'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
