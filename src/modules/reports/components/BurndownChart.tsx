'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ACCENT = '#6c63ff'; // hardcoded — Recharts cannot parse CSS vars

interface BurndownPoint {
  day: string;
  remaining: number;
}

interface Props {
  points: BurndownPoint[];
  sprintLabel?: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className='chart-tooltip px-3 py-2'>
      <p className='text-[12px] text-muted-foreground mb-0.5'>{label}</p>
      <p className='font-mono-dm text-[13px] font-semibold' style={{ color: ACCENT }}>
        {payload[0].value} pts còn lại
      </p>
    </div>
  );
}

export function BurndownChart({ points, sprintLabel }: Props) {
  return (
    <div className='bg-card border border-border panel p-5'>
      <div className='font-sans text-[16px] font-bold mb-4'>Burndown Chart{sprintLabel ? ` — ${sprintLabel}` : ''}</div>

      <ResponsiveContainer width='100%' height={180} initialDimension={{ width: 1, height: 1 }}>
        <AreaChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id='burndownGrad' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={ACCENT} stopOpacity={0.25} />
              <stop offset='95%' stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />

          <XAxis dataKey='day' tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />

          <YAxis tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

          <Area
            type='monotone'
            dataKey='remaining'
            stroke={ACCENT}
            strokeWidth={2}
            fill='url(#burndownGrad)'
            dot={{ r: 3.5, fill: ACCENT, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: ACCENT, stroke: 'var(--card)', strokeWidth: 2 }}
            animationDuration={800}
            animationEasing='ease-out'
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
