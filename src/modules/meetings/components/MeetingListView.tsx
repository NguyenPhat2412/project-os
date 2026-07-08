'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { CalendarIcon, ChevronUp, ChevronDown, ChevronsUpDown, PencilIcon, Trash2Icon } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';

type MeetingWithId = Meeting & { id: string };

const TH_CLASS = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-4';
const columnHelper = createColumnHelper<MeetingWithId>();

interface Props {
  meetings: MeetingWithId[];
  teamMembers: TeamMember[];
  onView: (meeting: MeetingWithId) => void;
  onEdit: (meeting: MeetingWithId) => void;
  onDelete?: (meeting: MeetingWithId) => void;
}

export function MeetingListView({ meetings, teamMembers, onView, onEdit, onDelete }: Props) {
  'use no memo';
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => meetings, [meetings]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'date',
        header: 'Ngày',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] font-semibold text-foreground'>{info.row.original.date ?? `${info.row.original.day}/${info.row.original.month}`}</span>,
      }),
      columnHelper.accessor('time', {
        header: 'Giờ',
        enableSorting: false,
        cell: (info) => <span className='font-mono-dm text-[12px] text-muted-foreground'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('title', {
        header: 'Tiêu đề',
        enableSorting: false,
        cell: (info) => (
          <div className='max-w-64'>
            <div className='text-[13px] font-semibold text-foreground truncate'>{info.getValue()}</div>
            {info.row.original.description && <div className='text-[12px] text-muted-foreground truncate mt-0.5'>{info.row.original.description}</div>}
          </div>
        ),
      }),
      columnHelper.accessor('location', {
        header: 'Địa điểm',
        enableSorting: false,
        cell: (info) => <span className='text-[12px] text-muted-foreground'>{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'attendees',
        header: 'Người tham dự',
        enableSorting: false,
        cell: (info) => {
          const attendees = (info.row.original.attendeeIds ?? []).map((id) => teamMembers.find((tm) => tm.id === id)).filter(Boolean) as TeamMember[];
          return (
            <div className='flex -space-x-1.5'>
              {attendees.slice(0, 4).map((a) => (
                <Avatar key={a.id} initials={a.initials} gradient={a.gradient} size='sm' className='ring-1 ring-card' />
              ))}
              {attendees.length > 4 && <div className='w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[12px] text-muted-foreground'>+{attendees.length - 4}</div>}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'status',
        header: 'Trạng thái',
        enableSorting: false,
        cell: (info) => (info.row.original.important ? <PageBadge variant='accent'>Quan trọng</PageBadge> : null),
      }),
      columnHelper.display({
        id: 'actions',
        enableSorting: false,
        cell: (info) => (
          <div className='flex items-center justify-end gap-1'>
            <Button
              variant='ghost'
              size='icon-xs'
              onClick={(e) => {
                e.stopPropagation();
                onEdit(info.row.original);
              }}
              className='text-muted-foreground hover:text-foreground'
            >
              <PencilIcon size={12} />
            </Button>
            {onDelete && (
              <Button
                variant='ghost'
                size='icon-xs'
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(info.row.original);
                }}
                className='text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
              >
                <Trash2Icon size={12} />
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [teamMembers, onEdit, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  if (meetings.length === 0) {
    return (
      <div className='bg-card border border-border panel p-8 text-center'>
        <CalendarIcon size={32} className='mx-auto mb-3 text-muted-foreground' />
        <p className='text-[13px] text-muted-foreground'>Chưa có cuộc họp nào.</p>
      </div>
    );
  }

  return (
    <div className='bg-card border border-border panel overflow-hidden'>
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
            <TableRow key={row.id} onClick={() => onView(row.original)} className='border-border hover:bg-secondary transition-colors cursor-pointer'>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className='py-3 px-4'>
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
