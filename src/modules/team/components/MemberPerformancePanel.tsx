'use client';

import { useMemo, useState } from 'react';
import { format, isAfter, isBefore, isValid, parse, startOfDay, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReportReadModel } from '@/lib/api/read-models';
import { isTaskDoneStatus } from '@/modules/tasks/utils/taskColumns';
import type { TeamMemberWithRole } from '@/modules/team/types/team';

type RangeDays = 7 | 30;

interface PerformanceItem {
  id: string;
  assigneeId?: string;
  status?: string;
  points?: number;
  deadline?: string;
  dueDate?: string;
  completedAt?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--popover-foreground)',
  boxShadow: 'var(--shadow-lg)',
};

function parseItemDate(value?: string): Date | null {
  if (!value) return null;
  const date = /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? parse(value, 'dd/MM/yyyy', new Date()) : new Date(value);
  return isValid(date) ? date : null;
}

function isDone(item: PerformanceItem): boolean {
  return isTaskDoneStatus(item.status ?? '', []);
}

function memberItems(items: PerformanceItem[], memberId: string): PerformanceItem[] {
  return items.filter((item) => item.assigneeId === memberId);
}

function statusLabel(status?: string): string {
  const value = (status || 'unknown').replace(/[-_]+/g, ' ').trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function completionDate(item: PerformanceItem): Date | null {
  if (!isDone(item)) return null;
  return parseItemDate(item.completedAt) ?? parseItemDate(item.resolvedAt) ?? parseItemDate(item.updatedAt);
}

function statusDistribution(items: PerformanceItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = statusLabel(item.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts, ([name, value]) => ({ name, value }));
}

export function MemberPerformancePanel({ member }: { member: TeamMemberWithRole }) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);
  const tasksQuery = useReportReadModel<PerformanceItem>('tasks');
  const bugsQuery = useReportReadModel<PerformanceItem>('bugs');

  const tasks = useMemo(() => memberItems(tasksQuery.data?.items ?? [], member.id), [member.id, tasksQuery.data?.items]);
  const bugs = useMemo(() => memberItems(bugsQuery.data?.items ?? [], member.id), [bugsQuery.data?.items, member.id]);
  const openTasks = useMemo(() => tasks.filter((task) => !isDone(task)), [tasks]);
  const openPoints = useMemo(() => openTasks.reduce((total, task) => total + (Number(task.points) || 0), 0), [openTasks]);

  const completionSeries = useMemo(() => {
    const today = startOfDay(new Date());
    const firstDay = subDays(today, rangeDays - 1);
    const counts = new Map<string, number>();

    for (const task of tasks) {
      const completed = completionDate(task);
      if (!completed) continue;
      const completedDay = startOfDay(completed);
      if (isBefore(completedDay, firstDay) || isAfter(completedDay, today)) continue;
      const key = format(completedDay, 'yyyy-MM-dd');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from({ length: rangeDays }, (_, index) => {
      const date = subDays(today, rangeDays - index - 1);
      return {
        date: format(date, 'dd/MM'),
        completed: counts.get(format(date, 'yyyy-MM-dd')) ?? 0,
      };
    });
  }, [rangeDays, tasks]);

  const taskTiming = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.reduce(
      (result, task) => {
        const deadline = parseItemDate(task.deadline ?? task.dueDate);
        const completed = completionDate(task);

        if (isDone(task)) {
          if (deadline && completed && isAfter(startOfDay(completed), startOfDay(deadline))) result.overdue += 1;
          else result.onTime += 1;
        } else if (deadline && isBefore(startOfDay(deadline), today)) {
          result.overdue += 1;
        } else {
          result.inProgress += 1;
        }
        return result;
      },
      { name: 'Task', onTime: 0, overdue: 0, inProgress: 0 },
    );
  }, [tasks]);

  const taskStatuses = useMemo(() => statusDistribution(tasks), [tasks]);
  const bugStatuses = useMemo(() => statusDistribution(bugs), [bugs]);
  const loading = tasksQuery.isLoading || bugsQuery.isLoading;
  const failed = tasksQuery.isError || bugsQuery.isError;

  if (loading) {
    return <div className='h-80 animate-pulse rounded-lg border border-border bg-secondary/50' aria-label='Đang tải dữ liệu hiệu suất' />;
  }

  if (failed) {
    return <div className='rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500'>Không thể tải read-model hiệu suất. Vui lòng thử lại.</div>;
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='text-sm font-semibold text-foreground'>Hiệu suất theo dự án hiện tại</h3>
          <p className='mt-1 text-xs text-muted-foreground'>Các chỉ số độc lập, không quy đổi thành một điểm năng suất.</p>
        </div>
        <div className='flex items-center gap-1 rounded-lg border border-border bg-secondary p-1' aria-label='Khoảng thời gian hoàn thành'>
          {([7, 30] as const).map((days) => (
            <Button key={days} type='button' size='sm' variant={rangeDays === days ? 'default' : 'ghost'} className='h-7 px-3 text-xs' onClick={() => setRangeDays(days)}>
              {days} ngày
            </Button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <ChartCard title='Workload hiện tại' description='Story point và số task chưa hoàn thành'>
          <ResponsiveContainer width='100%' height={190} initialDimension={{ width: 1, height: 1 }}>
            <BarChart
              layout='vertical'
              data={[
                { name: 'Story point mở', value: openPoints },
                { name: 'Task đang mở', value: openTasks.length },
              ]}
              margin={{ top: 8, right: 28, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' horizontal={false} />
              <XAxis type='number' allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type='category' dataKey='name' width={105} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--muted-foreground)' }} cursor={{ fill: 'var(--secondary)' }} />
              <Bar dataKey='value' name='Số lượng' fill='var(--chart-1)' radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Task hoàn thành trong ${rangeDays} ngày`} description='Số task hoàn thành theo từng ngày'>
          <ResponsiveContainer width='100%' height={190} initialDimension={{ width: 1, height: 1 }}>
            <LineChart data={completionSeries} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
              <XAxis dataKey='date' interval={rangeDays === 30 ? 4 : 0} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--muted-foreground)' }} />
              <Line type='monotone' dataKey='completed' name='Task hoàn thành' stroke='var(--chart-2)' strokeWidth={2.5} dot={rangeDays === 7} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title='Tiến độ task hiện tại' description='Đúng hạn, trễ hạn và đang xử lý'>
          <ResponsiveContainer width='100%' height={190} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={[taskTiming]} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
              <XAxis dataKey='name' tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--muted-foreground)' }} />
              <Legend wrapperStyle={{ color: 'var(--muted-foreground)', fontSize: 11 }} />
              <Bar dataKey='onTime' name='Đúng hạn' stackId='timing' fill='var(--chart-2)' />
              <Bar dataKey='overdue' name='Trễ hạn' stackId='timing' fill='var(--destructive)' />
              <Bar dataKey='inProgress' name='Đang xử lý' stackId='timing' fill='var(--chart-4)' radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title='Task và bug theo trạng thái' description='Vòng trong là task, vòng ngoài là bug'>
          {taskStatuses.length === 0 && bugStatuses.length === 0 ? (
            <div className='flex h-[190px] items-center justify-center text-sm text-muted-foreground'>Chưa có task hoặc bug được giao.</div>
          ) : (
            <div className='grid grid-cols-[minmax(0,1fr)_140px] items-center gap-2 max-sm:grid-cols-1'>
              <ResponsiveContainer width='100%' height={190} initialDimension={{ width: 1, height: 1 }}>
                <PieChart>
                  <Pie data={taskStatuses} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={30} outerRadius={52} paddingAngle={2} strokeWidth={0}>
                    {taskStatuses.map((item, index) => (
                      <Cell key={`task-${item.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Pie data={bugStatuses} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={60} outerRadius={82} paddingAngle={2} strokeWidth={0}>
                    {bugStatuses.map((item, index) => (
                      <Cell key={`bug-${item.name}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--muted-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className='space-y-3 text-xs'>
                <StatusLegend title='Task' items={taskStatuses} colorOffset={0} />
                <StatusLegend title='Bug' items={bugStatuses} colorOffset={2} />
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className='min-w-0'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm'>{title}</CardTitle>
        <CardDescription className='text-xs'>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatusLegend({ title, items, colorOffset }: { title: string; items: { name: string; value: number }[]; colorOffset: number }) {
  return (
    <div>
      <div className='mb-1.5 font-semibold text-foreground'>{title}</div>
      {items.length === 0 ? (
        <div className='text-muted-foreground'>Chưa có dữ liệu</div>
      ) : (
        <div className='space-y-1'>
          {items.map((item, index) => (
            <div key={item.name} className='flex items-center gap-2 text-muted-foreground'>
              <span className='h-2 w-2 shrink-0 rounded-full' style={{ backgroundColor: CHART_COLORS[(index + colorOffset) % CHART_COLORS.length] }} />
              <span className='min-w-0 flex-1 truncate'>{item.name}</span>
              <span className='font-mono-dm text-foreground'>{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
