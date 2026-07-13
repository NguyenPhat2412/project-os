'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportReadModel } from '@/lib/api/read-models';
import { PageLoader } from '@/components/ui/page-loader';
import { StatCard } from '@/components/ui/shared/stat-card';
import { PageBadge } from '@/components/ui/page-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import type { Task } from '@/modules/tasks/types/task';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';
import { ReportExportButton } from '@/modules/reports/components/report-export-button';

type WithId<T> = T & { id: string };
type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

const STATUS_LABEL: Record<string, string> = {
  done: 'Done',
  in_progress: 'In Progress',
  in_review: 'In Review',
  todo: 'To Do',
  backlog: 'Backlog',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  done: 'green',
  in_progress: 'accent',
  in_review: 'yellow',
  todo: 'muted',
  backlog: 'muted',
};
const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  High: TASK_PRIORITY_META.High.badgeVariant,
  Normal: TASK_PRIORITY_META.Normal.badgeVariant,
  Low: TASK_PRIORITY_META.Low.badgeVariant,
};
const STATUS_COLOR: Record<string, string> = {
  done: 'oklch(0.646 0.222 142.116)',
  in_progress: 'var(--primary)',
  in_review: '#f59e0b',
  todo: 'var(--muted)',
  backlog: 'var(--muted)',
};

const TH = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';
const columnHelper = createColumnHelper<WithId<Task> & { assigneeName: string }>();

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: { name: string; color: string } }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className='chart-tooltip px-3 py-2'>
      <p className='text-[12px] text-muted-foreground mb-0.5'>{payload[0].payload.name}</p>
      <p className='font-mono-dm text-[13px] font-semibold' style={{ color: payload[0].payload.color }}>
        {payload[0].value}
      </p>
    </div>
  );
}

export default function ReportsTasksPage() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useReportReadModel<WithId<Task>>('tasks');
  const tasks = useMemo(() => data?.items ?? [], [data?.items]);
  const team = useMemo(() => data?.members ?? [], [data?.members]);
  const memberMap = useMemo(() => Object.fromEntries(team.map((m) => [m.id, m.name])), [team]);

  const tableData = useMemo(() => tasks.map((t) => ({ ...t, assigneeName: memberMap[t.assigneeId ?? ''] ?? '—' })), [tasks, memberMap]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABEL[status] ?? status,
      value,
      color: STATUS_COLOR[status] ?? 'var(--muted)',
    }));
  }, [tasks]);

  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const total = tasks.length;
  const doneRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (i) => <span className='font-mono-dm text-[12px] text-primary'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('title', {
        header: 'Tiêu đề',
        enableSorting: false,
        cell: (i) => <span className='text-[12.5px]'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (i) => <PageBadge variant={STATUS_VARIANT[i.getValue()] ?? 'muted'}>{STATUS_LABEL[i.getValue()] ?? i.getValue()}</PageBadge>,
      }),
      columnHelper.accessor('priority', {
        header: 'Ưu tiên',
        enableSorting: false,
        cell: (i) => <PageBadge variant={PRIORITY_VARIANT[i.getValue()] ?? 'muted'}>{i.getValue()}</PageBadge>,
      }),
      columnHelper.accessor('assigneeName', {
        header: 'Assignee',
        enableSorting: false,
        cell: (i) => <span className='text-[12px] text-muted-foreground'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('deadline', {
        header: 'Deadline',
        enableSorting: false,
        cell: (i) => <span className='font-mono-dm text-[12px] text-muted-foreground'>{i.getValue() ?? '—'}</span>,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <SimplePageHeader title='Báo cáo công việc' segments={BREADCRUMBS.reportsTasks} actions={<ReportExportButton resource='tasks' />} />

      {/* Stats */}
      <div className='grid grid-cols-4 max-lg:grid-cols-2 gap-4 mb-4.5'>
        <StatCard label='Tổng công việc' value={total} delta='Tất cả tasks' deltaType='neutral' color='accent' />
        <StatCard label='Hoàn thành' value={done} delta={`${doneRate}% done`} deltaType={doneRate >= 50 ? 'positive' : 'neutral'} color='green' />
        <StatCard label='Đang thực hiện' value={inProgress} delta='In Progress' deltaType='neutral' color='yellow' />
        <StatCard label='Còn lại' value={total - done} delta='Chưa xong' deltaType={total - done > 0 ? 'negative' : 'positive'} color='red' />
      </div>

      {/* Chart */}
      <div className='bg-card border border-border panel p-5 mb-4.5'>
        <div className='font-sans text-[16px] font-bold mb-4'>Phân bổ theo trạng thái</div>
        <ResponsiveContainer width='100%' height={160} initialDimension={{ width: 1, height: 1 }}>
          <BarChart data={statusCounts} margin={{ top: 0, right: 0, left: -16, bottom: 0 }} barCategoryGap='35%'>
            <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
            <XAxis dataKey='name' tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--secondary)' }} />
            <Bar dataKey='value' radius={[4, 4, 0, 0]} animationDuration={700} animationEasing='ease-out'>
              {statusCounts.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className='bg-card border border-border panel p-5'>
        <div className='font-sans text-[16px] font-bold mb-4'>Danh sách công việc</div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className='border-border hover:bg-transparent'>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableHead key={h.id} className={TH} onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}>
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='py-10 text-center text-[13px] text-muted-foreground'>
                  Chưa có dữ liệu.
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
    </div>
  );
}
