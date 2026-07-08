'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie } from 'recharts';
import type { TeamMember, WorkloadStatus } from '@/modules/team/types/team';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HEALTH_COLOR = {
  green: '#3dd68c',
  accent: '#6c63ff',
  red: '#ff5f5f',
  muted: '#5e5e78',
  amber: '#f59e0b',
};

const STATUS_CONFIG: { key: WorkloadStatus; label: string; color: string }[] = [
  { key: 'Active', label: 'Active', color: HEALTH_COLOR.green },
  { key: 'Busy', label: 'Busy', color: HEALTH_COLOR.accent },
  { key: 'Overloaded', label: 'Overloaded', color: HEALTH_COLOR.red },
  { key: 'Vacant', label: 'Vacant', color: HEALTH_COLOR.muted },
];

interface Props {
  members: TeamMember[];
}

interface StatusTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}

function StatusTooltip({ active, payload }: StatusTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className='chart-tooltip px-3 py-2'>
      <p className='font-mono-dm text-[12px]' style={{ color: payload[0].payload.color }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
}

function HealthTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return <div className='chart-tooltip px-3 py-1.5 text-[12px]'>{payload[0].value}%</div>;
}

interface WorkloadTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { name: string } }[];
}

function WorkloadTooltip({ active, payload }: WorkloadTooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const color = val > 90 ? HEALTH_COLOR.red : val > 70 ? HEALTH_COLOR.amber : HEALTH_COLOR.accent;
  return (
    <div className='chart-tooltip px-3 py-2'>
      <p className='mb-0.5 text-[12px] text-muted-foreground'>{payload[0].payload.name}</p>
      <p className='font-mono-dm text-[13px] font-semibold' style={{ color }}>
        {val}%
      </p>
    </div>
  );
}

export function TeamStatsPanel({ members }: Props) {
  const total = members.length;
  const overloaded = members.filter((m) => m.status === 'Overloaded').length;
  const vacant = members.filter((m) => m.status === 'Vacant').length;
  const active = members.filter((m) => m.status === 'Active').length;
  const avgWorkload = total > 0 ? Math.round(members.reduce((sum, m) => sum + (m.workload ?? 0), 0) / total) : 0;

  const penalty = overloaded * 15 + vacant * 5 + Math.max(0, avgWorkload - 85) * 2;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const healthLabel =
    healthScore >= 90
      ? { text: 'Cân bằng', color: HEALTH_COLOR.green }
      : healthScore >= 70
        ? { text: 'Tốt', color: HEALTH_COLOR.accent }
        : healthScore >= 50
          ? { text: 'Căng thẳng', color: HEALTH_COLOR.amber }
          : { text: 'Quá tải', color: HEALTH_COLOR.red };

  const sortedByWorkload = [...members]
    .sort((a, b) => (b.workload ?? 0) - (a.workload ?? 0))
    .slice(0, 6)
    .filter((m) => m.name);

  const radialData = [{ name: 'score', value: healthScore, fill: healthLabel.color }];

  const summaryCards = [
    { label: 'Tổng thành viên', value: total, sub: 'Trong dự án', color: 'var(--foreground)' },
    { label: 'Overloaded', value: overloaded, sub: 'Cần điều phối ngay', color: overloaded > 0 ? HEALTH_COLOR.red : HEALTH_COLOR.green },
    { label: 'Workload TB', value: `${avgWorkload}%`, sub: avgWorkload > 85 ? 'Đang căng thẳng' : 'Trong ngưỡng tốt', color: avgWorkload > 85 ? HEALTH_COLOR.red : avgWorkload > 70 ? HEALTH_COLOR.amber : HEALTH_COLOR.green },
    { label: 'Đang hoạt động', value: active, sub: `${vacant} thành viên rảnh`, color: active > 0 ? HEALTH_COLOR.accent : HEALTH_COLOR.muted },
  ];

  return (
    <div className='mb-6 grid grid-cols-12 gap-4'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs col-span-12 grid grid-cols-12 gap-4'>
        {summaryCards.map((s) => (
          <Card key={s.label} className='col-span-3 max-lg:col-span-6 max-sm:col-span-12'>
            <CardHeader className='pb-3'>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className='text-[28px] font-bold leading-none' style={{ color: s.color }}>
                {s.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-[12px] text-muted-foreground'>{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='col-span-4 max-lg:col-span-6 max-sm:col-span-12'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>Theo trạng thái</CardTitle>
          <CardDescription>Phân bổ thành viên theo workload status</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const pieData = STATUS_CONFIG.map((s) => ({ name: s.label, value: members.filter((m) => m.status === s.key).length, color: s.color })).filter((d) => d.value > 0);
            if (pieData.length === 0) return <p className='text-[12px] text-muted-foreground'>Chưa có thành viên.</p>;
            return (
              <>
                <ResponsiveContainer width='100%' height={110}>
                  <PieChart>
                    <Pie data={pieData} cx='50%' cy='50%' innerRadius={32} outerRadius={50} paddingAngle={3} dataKey='value' animationBegin={0} animationDuration={800} animationEasing='ease-out' strokeWidth={0}>
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className='mt-1 grid grid-cols-2 gap-x-3 gap-y-1'>
                  {STATUS_CONFIG.map((s) => {
                    const count = members.filter((m) => m.status === s.key).length;
                    return (
                      <div key={s.key} className='flex items-center gap-1.5'>
                        <span className='h-2 w-2 shrink-0 rounded-full' style={{ background: s.color }} />
                        <span className='truncate text-[12px] text-muted-foreground'>{s.label}</span>
                        <span className='ml-auto font-mono-dm text-[12px] text-muted-foreground'>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      <Card className='col-span-4 max-lg:col-span-6 max-sm:col-span-12'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>Workload thành viên</CardTitle>
          <CardDescription>Nhóm thành viên có workload cao nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedByWorkload.length === 0 ? (
            <p className='text-[12px] text-muted-foreground'>Chưa có thành viên.</p>
          ) : (
            <ResponsiveContainer width='100%' height={sortedByWorkload.length * 30 + 8}>
              <BarChart layout='vertical' data={sortedByWorkload.map((m) => ({ name: m.name.split(' ').slice(-1)[0], fullName: m.name, value: m.workload }))} margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barCategoryGap='30%'>
                <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' horizontal={false} />
                <XAxis type='number' domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type='category' dataKey='name' tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<WorkloadTooltip />} cursor={{ fill: 'var(--secondary)' }} />
                <Bar dataKey='value' radius={[0, 4, 4, 0]} animationDuration={700} animationEasing='ease-out'>
                  {sortedByWorkload.map((m, i) => (
                    <Cell key={i} fill={(m.workload ?? 0) > 90 ? HEALTH_COLOR.red : (m.workload ?? 0) > 70 ? HEALTH_COLOR.amber : HEALTH_COLOR.accent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className='col-span-4 max-lg:col-span-6 max-sm:col-span-12'>
        <CardHeader className='items-center pb-3 text-center'>
          <CardTitle className='text-sm'>Sức khỏe nhân sự</CardTitle>
          <CardDescription>Dựa trên workload và trạng thái hiện tại</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center gap-3'>
          <div className='relative h-28 w-28'>
            <ResponsiveContainer width='100%' height='100%'>
              <RadialBarChart cx='50%' cy='50%' innerRadius='72%' outerRadius='100%' startAngle={90} endAngle={-270} data={radialData}>
                <RadialBar background={{ fill: '#17171f' }} dataKey='value' cornerRadius={8} animationBegin={0} animationDuration={900} animationEasing='ease-out' />
                <Tooltip content={<HealthTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>

            <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
              <span className='font-sans text-[20px] font-bold leading-none' style={{ color: healthLabel.color }}>
                {healthScore}
              </span>
              <span className='mt-0.5 text-[9px] text-muted-foreground'>/100</span>
            </div>
          </div>

          <div className='text-[12px] font-semibold' style={{ color: healthLabel.color }}>
            {healthLabel.text}
          </div>
          <div className='text-center text-[12px] leading-relaxed text-muted-foreground'>
            Dựa trên workload và trạng thái thành viên
            {overloaded > 0 && (
              <span className='mt-0.5 block font-semibold' style={{ color: 'oklch(0.577 0.245 27.325)' }}>
                {overloaded} thành viên overloaded
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
