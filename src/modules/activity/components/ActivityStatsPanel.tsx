'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/shared/stat-card';

const CHART_COLORS = { accent: '#6c63ff', red: '#ff5f5f', green: '#3dd68c', cyan: '#06b6d4' };

interface TooltipPayload {
  value: number;
  payload: { name: string; color: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className='chart-tooltip px-3 py-2'>
      <p className='mb-0.5 text-[12px] text-muted-foreground'>{payload[0].payload.name}</p>
      <p className='font-mono-dm text-[13px] font-semibold' style={{ color: payload[0].payload.color }}>
        {payload[0].value}
      </p>
    </div>
  );
}

export interface ActivityStatsProps {
  tasksDone: number;
  tasksTotal: number;
  bugsOpen: number;
  sprintsActive: number;
  meetingsTotal: number;
}

export function ActivityStatsPanel({ tasksDone, tasksTotal, bugsOpen, sprintsActive, meetingsTotal }: ActivityStatsProps) {
  const taskRate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const chartData = [
    { name: 'Tasks', value: tasksTotal, color: CHART_COLORS.accent },
    { name: 'Bugs', value: bugsOpen, color: CHART_COLORS.red },
    { name: 'Sprints', value: sprintsActive, color: CHART_COLORS.green },
    { name: 'Meetings', value: meetingsTotal, color: CHART_COLORS.cyan },
  ];

  return (
    <div className='mb-4.5 grid grid-cols-[repeat(4,1fr)_2fr] gap-4 max-lg:grid-cols-2'>
      <StatCard label='Tasks hoàn thành' value={`${tasksDone}/${tasksTotal}`} delta={`${taskRate}% done`} deltaType={taskRate >= 50 ? 'positive' : 'neutral'} color='accent' />
      <StatCard label='Bugs đang mở' value={bugsOpen} delta={bugsOpen === 0 ? 'Không có bug' : 'Cần xử lý'} deltaType={bugsOpen === 0 ? 'positive' : 'negative'} color='red' />
      <StatCard label='Sprint đang chạy' value={sprintsActive} delta={sprintsActive > 0 ? 'Đang hoạt động' : 'Không có'} deltaType={sprintsActive > 0 ? 'positive' : 'neutral'} color='green' />
      <StatCard label='Cuộc họp' value={meetingsTotal} delta='Tổng số' deltaType='neutral' color='purple' />
      <Card className='max-lg:col-span-2'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>Hoạt động theo loại</CardTitle>
          <CardDescription>Tổng quan khối lượng hoạt động hiện tại</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={72} initialDimension={{ width: 1, height: 1 }}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -16, bottom: 0 }} barCategoryGap='30%'>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
              <XAxis dataKey='name' tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)' }} />
              <Bar dataKey='value' radius={[4, 4, 0, 0]} animationDuration={700} animationEasing='ease-out'>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
