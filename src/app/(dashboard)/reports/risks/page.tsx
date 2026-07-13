'use client';
import { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportReadModel } from '@/lib/api/read-models';
import { PageLoader } from '@/components/ui/page-loader';
import { StatCard } from '@/components/ui/shared/stat-card';
import { PageBadge } from '@/components/ui/page-badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import type { Risk } from '@/modules/risk/types/risk';
import { ReportExportButton } from '@/modules/reports/components/report-export-button';

type WithId<T> = T & { id: string };
type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

const LEVEL_VARIANT: Record<string, BadgeVariant> = {
  Critical: 'red',
  High: 'yellow',
  Medium: 'accent',
  Low: 'muted',
};
const LEVEL_COLOR: Record<string, string> = {
  Critical: 'oklch(0.577 0.245 27.325)',
  High: '#f97316',
  Medium: 'var(--primary)',
  Low: 'var(--muted)',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  open: 'red',
  mitigated: 'green',
  monitoring: 'yellow',
  closed: 'muted',
};

const TH = 'font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.2px] py-2.25 px-3';
const columnHelper = createColumnHelper<WithId<Risk> & { ownerName: string }>();

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

export default function ReportsRisksPage() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useReportReadModel<WithId<Risk>>('risks');
  const risks = data?.items ?? [];
  const team = data?.members ?? [];
  const memberMap = Object.fromEntries(team.map((m) => [m.id, m.name]));

  const tableData = useMemo(() => risks.map((r) => ({ ...r, ownerName: memberMap[r.ownerId] ?? '—' })), [risks, team]);

  const levelData = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach((r) => {
      counts[r.level] = (counts[r.level] ?? 0) + 1;
    });
    return (['Critical', 'High', 'Medium', 'Low'] as const).map((level) => ({ name: level, value: counts[level] ?? 0, color: LEVEL_COLOR[level] })).filter((d) => d.value > 0);
  }, [risks]);

  const total = risks.length;
  const critical = risks.filter((r) => r.level === 'Critical').length;
  const high = risks.filter((r) => r.level === 'High').length;
  const open = risks.filter((r) => r.status === 'open').length;

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (i) => <span className='font-mono-dm text-[12px] text-primary'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('description', {
        header: 'Mô tả rủi ro',
        enableSorting: false,
        cell: (i) => <span className='text-[12.5px]'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('level', {
        header: 'Mức độ',
        enableSorting: false,
        cell: (i) => <PageBadge variant={LEVEL_VARIANT[i.getValue()] ?? 'muted'}>{i.getValue()}</PageBadge>,
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        enableSorting: false,
        cell: (i) => <PageBadge variant={STATUS_VARIANT[i.getValue()] ?? 'muted'}>{i.getValue()}</PageBadge>,
      }),
      columnHelper.accessor('mitigation', {
        header: 'Biện pháp',
        enableSorting: false,
        cell: (i) => <span className='text-[12px] text-muted-foreground max-w-xs truncate block'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('ownerName', {
        header: 'Owner',
        enableSorting: false,
        cell: (i) => <span className='text-[12px] text-muted-foreground'>{i.getValue()}</span>,
      }),
      columnHelper.accessor('dueDate', {
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
    state: { sorting },
    onSortingChange: setSorting,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <SimplePageHeader title='Báo cáo rủi ro' segments={BREADCRUMBS.reportsRisks} actions={<ReportExportButton resource='risks' />} />

      {/* Stats */}
      <div className='grid grid-cols-4 max-lg:grid-cols-2 gap-4 mb-4.5'>
        <StatCard label='Tổng rủi ro' value={total} delta='Tất cả risks' deltaType='neutral' color='accent' />
        <StatCard label='Critical' value={critical} delta='Cần xử lý ngay' deltaType={critical > 0 ? 'negative' : 'positive'} color='red' />
        <StatCard label='High' value={high} delta='Mức cao' deltaType={high > 0 ? 'negative' : 'positive'} color='yellow' />
        <StatCard label='Đang mở' value={open} delta='Chưa giải quyết' deltaType={open > 0 ? 'negative' : 'positive'} color='red' />
      </div>

      {/* Chart */}
      <div className='bg-card border border-border panel p-5 mb-4.5'>
        <div className='font-sans text-[16px] font-bold mb-4'>Phân bổ theo mức độ</div>
        <ResponsiveContainer width='100%' height={140}>
          <BarChart data={levelData} margin={{ top: 0, right: 0, left: -16, bottom: 0 }} barCategoryGap='40%'>
            <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
            <XAxis dataKey='name' tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--secondary)' }} />
            <Bar dataKey='value' radius={[4, 4, 0, 0]} animationDuration={700} animationEasing='ease-out'>
              {levelData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className='bg-card border border-border panel p-5'>
        <div className='font-sans text-[16px] font-bold mb-4'>Danh sách rủi ro</div>
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
                <TableCell colSpan={7} className='py-10 text-center text-[13px] text-muted-foreground'>
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
