'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageBadge } from '@/components/ui/page-badge';
import { TableActionsMenu, editAction, deleteAction, viewAction, openLinkAction, separator } from '@/components/ui/shared/table-actions-menu';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';

type WikiEntry = WikiLink & { id: string };

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2 px-3';
const columnHelper = createColumnHelper<WikiEntry>();

interface WikiTableProps {
  wikiLinks: WikiEntry[];
  onView: (wiki: WikiEntry) => void;
  onEdit: (wiki: WikiEntry) => void;
  onDelete: (wiki: WikiEntry) => void;
}

export function WikiTable({ wikiLinks, onView, onEdit, onDelete }: WikiTableProps) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => wikiLinks, [wikiLinks]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Tiêu đề',
        enableSorting: false,
        cell: (info) => (
          <button
            onClick={(e) => { e.stopPropagation(); onView(info.row.original); }}
            className='flex items-center gap-2.5 text-left w-full hover:opacity-80 transition-opacity'
          >
            <span className='shrink-0 text-[15px]'>{info.row.original.icon}</span>
            <span className='text-[13px] font-medium truncate text-foreground'>{info.getValue()}</span>
          </button>
        ),
      }),
      columnHelper.accessor('summary', {
        header: 'Mô tả',
        enableSorting: false,
        cell: (info) => {
          const val = info.getValue();
          return <span className='text-[12px] text-muted-foreground line-clamp-1'>{val ?? <span className='italic'>—</span>}</span>;
        },
      }),
      columnHelper.accessor('tags', {
        header: 'Tags',
        enableSorting: false,
        cell: (info) => {
          const tags = info.getValue();
          if (!tags || tags.length === 0) return <span className='text-[12px] text-muted-foreground'>—</span>;
          return (
            <div className='flex items-center gap-1 flex-wrap'>
              {tags.slice(0, 3).map((tag: string) => (
                <PageBadge key={tag} variant='muted'>
                  {tag}
                </PageBadge>
              ))}
              {tags.length > 3 && <span className='text-[12px] text-muted-foreground'>+{tags.length - 3}</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Cập nhật',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap'>{info.getValue() ?? '—'}</span>,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Tạo lúc',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap'>{info.getValue() ?? '—'}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => {
          const actions: ReturnType<typeof editAction>[] = [];
          if (info.row.original.url) {
            actions.push(openLinkAction(() => { window.open(info.row.original.url!, '_blank'); }));
            actions.push(separator());
          }
          actions.push(viewAction(() => onView(info.row.original)));
          actions.push(editAction(() => onEdit(info.row.original)));
          actions.push(deleteAction(() => onDelete(info.row.original)));
          return (
            <div className='flex items-center justify-end'>
              <TableActionsMenu actions={actions} />
            </div>
          );
        },
      }),
    ],
    [onView, onEdit, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  if (wikiLinks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground'>
        <span className='text-3xl'>📄</span>
        <p className='text-[13px]'>Chưa có wiki nào.</p>
      </div>
    );
  }

  return (
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
  );
}
