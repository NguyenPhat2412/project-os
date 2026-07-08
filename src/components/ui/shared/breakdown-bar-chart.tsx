'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface BreakdownItem {
  name: string;
  value: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: BreakdownItem }[];
}

function BreakdownTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className='chart-tooltip px-3 py-2'>
      <p className='mb-0.5 text-[12px] text-muted-foreground'>{d.payload.name}</p>
      <p className='font-mono-dm text-[13px] font-semibold' style={{ color: d.payload.color }}>
        {d.value}
      </p>
    </div>
  );
}

interface Props {
  title: string;
  items: BreakdownItem[];
  className?: string;
}

export function BreakdownBarChart({ title, items, className }: Props) {
  const hasData = items.some((i) => i.value > 0);

  return (
    <Card className={cn('col-span-4 max-lg:col-span-6 max-sm:col-span-12', className)}>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm'>{title}</CardTitle>
        <CardDescription>Phân bố dữ liệu hiện tại</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className='text-[12px] text-muted-foreground'>Chưa có dữ liệu.</p>
        ) : (
          <ResponsiveContainer width='100%' height={items.length * 28 + 16}>
            <BarChart layout='vertical' data={items} margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barCategoryGap='30%'>
              <XAxis type='number' tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type='category' dataKey='name' tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<BreakdownTooltip />} cursor={{ fill: 'var(--secondary)' }} />
              <Bar dataKey='value' radius={[0, 4, 4, 0]} animationDuration={700} animationEasing='ease-out'>
                {items.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
