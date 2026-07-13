'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportReadModel } from '@/lib/api/read-models';
import { PageLoader } from '@/components/ui/page-loader';
import { StatCard } from '@/components/ui/shared/stat-card';
import { PageBadge } from '@/components/ui/page-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import type { Bug } from '@/modules/bugs/types/bug';
import { BUG_SEVERITY_META } from '@/lib/constants/work-item-colors';
import { ReportExportButton } from '@/modules/reports/components/report-export-button';

type WithId<T> = T & { id: string };
type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

const SEV_VARIANT: Record<string, BadgeVariant> = {
  Critical: BUG_SEVERITY_META.Critical.badgeVariant,
  High: BUG_SEVERITY_META.High.badgeVariant,
  Medium: BUG_SEVERITY_META.Medium.badgeVariant,
  Low: BUG_SEVERITY_META.Low.badgeVariant,
};
const SEV_COLOR: Record<string, string> = {
  Critical: BUG_SEVERITY_META.Critical.chartColor,
  High: BUG_SEVERITY_META.High.chartColor,
  Medium: BUG_SEVERITY_META.Medium.chartColor,
  Low: BUG_SEVERITY_META.Low.chartColor,
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  open: 'red',
  'in-progress': 'accent',
  'in-review': 'yellow',
  fixed: 'green',
  'wont-fix': 'muted',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  fixed: 'Fixed',
  'wont-fix': "Won't Fix",
};

const TH = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';
const columnHelper = createColumnHelper<WithId<Bug> & { assigneeName: string }>();

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

export default function ReportsBugsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useReportReadModel<WithId<Bug>>('bugs');
  const bugs = data?.items ?? [];
  const team = data?.members ?? [];
  const memberMap = Object.fromEntries(team.map((m) => [m.id, m.name]));

  const tableData = useMemo(() => bugs.map((b) => ({ ...b, assigneeName: memberMap[b.assigneeId ?? ''] ?? '—' })), [bugs, team]);

  const sevData = useMemo(() => {
    const counts: Record<string, number> = {};
    bugs.forEach((b) => {
      counts[b.severity] = (counts[b.severity] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([sev, value]) => ({ name: sev, value, color: SEV_COLOR[sev] ?? 'var(--muted)' }))
      .filter((d) => d.value > 0);
  }, [bugs]);

  const total = bugs.length;
  const open = bugs.filter((b) => b.status === 'open').length;
  const inProgress = bugs.filter((b) => b.status === 'in-progress').length;
  const fixed = bugs.filter((b) => b.status === 'fixed').length;
  const critical = bugs.filter((b) => b.severity === 'Critical').length;

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (i) => <span className='font-mono-dm text-[12px] text-primary'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('title', {
        header: 'Mô tả',
        enableSorting: false,
        cell: (i) => <span className='text-[12.5px]'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('severity', {
        header: 'Severity',
        enableSorting: false,
        cell: (i) => <PageBadge variant={SEV_VARIANT[i.getValue()] ?? 'muted'}>{i.getValue()}</PageBadge>,
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (i) => <PageBadge variant={STATUS_VARIANT[i.getValue()] ?? 'muted'}>{STATUS_LABEL[i.getValue()] ?? i.getValue()}</PageBadge>,
      }),
      columnHelper.accessor('assigneeName', {
        header: 'Assignee',
        enableSorting: false,
        cell: (i) => <span className='text-[12px] text-muted-foreground'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('reportedAt', {
        header: 'Ngày phát hiện',
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
    state: { sorting },
    onSortingChange: setSorting,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <SimplePageHeader title='Báo cáo lỗi' segments={BREADCRUMBS.reportsBugs} actions={<ReportExportButton resource='bugs' />} />

      {/* Stats */}
      <div className='grid grid-cols-4 max-lg:grid-cols-2 gap-4 mb-4.5'>
        <StatCard label='Tổng lỗi' value={total} delta='Tất cả bugs' deltaType='neutral' color='accent' />
        <StatCard label='Đang mở' value={open} delta='Chưa xử lý' deltaType={open > 0 ? 'negative' : 'positive'} color='red' />
        <StatCard label='Đang xử lý' value={inProgress} delta='In Progress' deltaType='neutral' color='yellow' />
        <StatCard label='Đã sửa' value={fixed} delta={`${total > 0 ? Math.round((fixed / total) * 100) : 0}% resolved`} deltaType={fixed > 0 ? 'positive' : 'neutral'} color='green' />
      </div>

      {/* Chart + Critical */}
      <div className='grid grid-cols-[1fr_2fr] max-lg:grid-cols-1 gap-4.5 mb-4.5'>
        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3'>Theo mức độ</div>
          <ResponsiveContainer width='100%' height={120}>
            <PieChart>
              <Pie data={sevData} cx='50%' cy='50%' innerRadius={34} outerRadius={52} paddingAngle={3} dataKey='value' animationBegin={0} animationDuration={800} animationEasing='ease-out' strokeWidth={0}>
                {sevData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className='grid grid-cols-2 gap-x-3 gap-y-1 mt-2'>
            {sevData.map((d) => (
              <div key={d.name} className='flex items-center gap-1.5'>
                <span className='w-2 h-2 rounded-full shrink-0' style={{ background: d.color }} />
                <span className='text-[12px] text-muted-foreground truncate'>{d.name}</span>
                <span className='font-mono-dm text-[12px] text-muted-foreground ml-auto'>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-card border border-border panel p-5'>
          <div className='font-sans text-[16px] font-bold mb-3'>Lỗi Critical ({critical})</div>
          <div className='space-y-2'>
            {bugs
              .filter((b) => b.severity === 'Critical')
              .slice(0, 5)
              .map((b) => (
                <div key={b.id} className='flex items-center gap-3 py-2 border-b border-border last:border-0'>
                  <span className='font-mono-dm text-[12px] text-primary shrink-0'>{b.id}</span>
                  <span className='text-[12.5px] flex-1 truncate'>{b.title}</span>
                  <PageBadge variant={STATUS_VARIANT[b.status] ?? 'muted'}>{STATUS_LABEL[b.status] ?? b.status}</PageBadge>
                </div>
              ))}
            {critical === 0 && <p className='text-[13px] text-muted-foreground py-4 text-center'>Không có lỗi Critical.</p>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='bg-card border border-border panel p-5'>
        <div className='font-sans text-[16px] font-bold mb-4'>Danh sách lỗi</div>
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
