'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import { PageBadge } from '@/components/ui/page-badge';
import type { ActivityEntry } from '@/modules/activity/types/activity';

type EntryType = 'task' | 'bug' | 'sprint' | 'meeting';
type ActiveFilter = EntryType | 'all';

interface ActivityRow extends ActivityEntry {
  type: EntryType;
}

const TYPE_TABS: { key: ActiveFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'task', label: 'Tasks' },
  { key: 'bug', label: 'Bugs' },
  { key: 'sprint', label: 'Sprints' },
  { key: 'meeting', label: 'Họp' },
];

const TYPE_BADGE: Record<EntryType, { label: string; variant: 'accent' | 'red' | 'green' | 'purple' }> = {
  task: { label: 'Task', variant: 'accent' },
  bug: { label: 'Bug', variant: 'red' },
  sprint: { label: 'Sprint', variant: 'green' },
  meeting: { label: 'Meeting', variant: 'purple' },
};

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';

function getEntryType(id: string): EntryType {
  if (id.startsWith('bug')) return 'bug';
  if (id.startsWith('sprint')) return 'sprint';
  if (id.startsWith('meeting')) return 'meeting';
  return 'task';
}

const columnHelper = createColumnHelper<ActivityRow>();

interface Props {
  entries: ActivityEntry[];
}

export function ActivityLogTable({ entries }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const [activeType, setActiveType] = useState<ActiveFilter>('all');

  const data = useMemo<ActivityRow[]>(() => entries.filter((e) => activeType === 'all' || e.id.startsWith(activeType)).map((e) => ({ ...e, type: getEntryType(e.id) })), [entries, activeType]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('type', {
        header: 'Loại',
        enableSorting: false,
        cell: (info) => {
          const t = info.getValue();
          const cfg = TYPE_BADGE[t];
          return <PageBadge variant={cfg.variant}>{cfg.label}</PageBadge>;
        },
      }),
      columnHelper.display({
        id: 'content',
        header: 'Nội dung',
        enableSorting: false,
        cell: (info) => (
          <div className='flex items-center gap-2.5'>
            <Avatar initials={info.row.original.avatar.initials} color={info.row.original.avatar.color} size='sm' className='shrink-0' />
            <span className='text-[12.5px] text-muted-foreground leading-normal' dangerouslySetInnerHTML={{ __html: info.row.original.content }} />
          </div>
        ),
      }),
      columnHelper.accessor('badge', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (info) => {
          const badge = info.getValue();
          if (!badge) return <span className='text-muted-foreground'>—</span>;
          return <PageBadge variant={info.row.original.badgeVariant ?? 'muted'}>{badge}</PageBadge>;
        },
      }),
      columnHelper.accessor('time', {
        header: 'Thời gian',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground whitespace-nowrap'>{info.getValue()}</span>,
      }),
    ],
    [],
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
    <div>
      <div className='flex gap-1 mb-3 flex-wrap'>
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveType(tab.key)}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${activeType === tab.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-muted-foreground hover:bg-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className='border-border hover:bg-transparent'>
              {hg.headers.map((h) => (
                <TableHead key={h.id} className={TH_CLASS}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow className='border-border hover:bg-transparent'>
              <TableCell colSpan={4} className='py-8 text-center text-[13px] text-muted-foreground'>
                Chưa có hoạt động nào.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className='border-border hover:bg-secondary transition-colors'>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className='py-2.5 px-3'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
