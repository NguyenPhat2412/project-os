'use client';

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { BudgetItem, ExpenseEntry } from '@/modules/budget/types/budget';
import { formatCurrencyVND } from '@/lib/numberjs';
import { ScoreDonut } from '@/components/ui/shared/score-donut';
import { BreakdownBarChart } from '@/components/ui/shared/breakdown-bar-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type BudgetItemWithId = BudgetItem & { id: string };
type ExpenseWithId = ExpenseEntry & { id: string };

const CHART_COLORS = { green: '#3dd68c', accent: '#6c63ff', red: '#ff5f5f', amber: '#f59e0b' };

interface SpendingTooltipProps {
  active?: boolean;
  payload?: { payload: { category: string; spent: number; budget: number; isOver: boolean } }[];
}

function SpendingTooltip({ active, payload }: SpendingTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className='chart-tooltip px-3 py-2'>
      <p className='mb-1 text-[12px] text-muted-foreground'>{d.category}</p>
      <p className='font-mono-dm text-[12px]' style={{ color: d.isOver ? CHART_COLORS.red : CHART_COLORS.accent }}>
        {formatCurrencyVND(d.spent)} / {formatCurrencyVND(d.budget)}
      </p>
    </div>
  );
}

interface Props {
  budgetItems: BudgetItemWithId[];
  expenses: ExpenseWithId[];
}

export function BudgetStatsPanel({ budgetItems, expenses }: Props) {
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const utilizationPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const paid = expenses.filter((e) => e.status === 'Paid').length;
  const pending = expenses.filter((e) => e.status === 'Pending').length;
  const overBudgetCount = budgetItems.filter((item) => item.spent > item.budget).length;
  const withinBudgetCount = budgetItems.length - overBudgetCount;

  const penalty = (utilizationPct > 100 ? (utilizationPct - 100) * 1.5 : 0) + pending * 5;
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));
  const healthLabel =
    healthScore >= 90 ? { text: 'Tốt', color: CHART_COLORS.green } : healthScore >= 70 ? { text: 'Khá', color: CHART_COLORS.accent } : healthScore >= 50 ? { text: 'Cảnh báo', color: CHART_COLORS.amber } : { text: 'Nguy hiểm', color: CHART_COLORS.red };

  const spendingData = budgetItems.map((item) => ({
    category: item.category.length > 10 ? item.category.slice(0, 10) + '…' : item.category,
    fullCategory: item.category,
    value: item.budget > 0 ? Math.min(100, Math.round((item.spent / item.budget) * 100)) : 0,
    spent: item.spent,
    budget: item.budget,
    isOver: item.spent > item.budget,
  }));

  const expenseStatusItems = [
    { name: 'Đã thanh toán', value: paid, color: CHART_COLORS.green },
    { name: 'Chờ duyệt', value: pending, color: CHART_COLORS.amber },
  ];

  const summaryCards = [
    { label: 'Tổng ngân sách', value: formatCurrencyVND(totalBudget), sub: `${budgetItems.length} hạng mục`, color: 'var(--foreground)' },
    { label: 'Đã chi', value: formatCurrencyVND(totalSpent), sub: `${utilizationPct}% sử dụng`, color: utilizationPct > 90 ? 'oklch(0.577 0.245 27.325)' : 'var(--primary)' },
    { label: 'Còn lại', value: formatCurrencyVND(totalRemaining), sub: overBudgetCount > 0 ? `${overBudgetCount} vượt ngân sách` : 'Trong ngân sách', color: totalRemaining < 0 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.646 0.222 142.116)' },
    { label: 'Chi phí', value: expenses.length, sub: `${paid} đã thanh toán · ${pending} chờ duyệt`, color: pending > 0 ? '#f59e0b' : 'oklch(0.646 0.222 142.116)' },
  ];

  return (
    <div className='mb-6 grid grid-cols-12 gap-4'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs col-span-12 grid grid-cols-12 gap-4'>
        {summaryCards.map((s) => (
          <Card key={s.label} className='col-span-3 max-lg:col-span-6 max-sm:col-span-12'>
            <CardHeader className='pb-3'>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className='text-[24px] font-bold leading-none' style={{ color: s.color }}>
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
          <CardTitle className='text-sm'>Chi tiêu theo hạng mục</CardTitle>
          <CardDescription>Tỷ lệ sử dụng ngân sách theo từng nhóm</CardDescription>
        </CardHeader>
        <CardContent>
          {spendingData.length === 0 ? (
            <p className='text-[12px] text-muted-foreground'>Chưa có hạng mục.</p>
          ) : (
            <ResponsiveContainer width='100%' height={spendingData.length * 28 + 16}>
              <BarChart layout='vertical' data={spendingData} margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap='30%'>
                <XAxis type='number' domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type='category' dataKey='category' tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<SpendingTooltip />} cursor={{ fill: 'var(--secondary)' }} />
                <Bar dataKey='value' radius={[0, 4, 4, 0]} animationDuration={700} animationEasing='ease-out'>
                  {spendingData.map((d, i) => (
                    <Cell key={i} fill={d.isOver ? CHART_COLORS.red : CHART_COLORS.accent} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <BreakdownBarChart title='Theo trạng thái chi phí' items={expenseStatusItems} />

      <ScoreDonut
        title='Sức khỏe ngân sách'
        label={healthLabel.text}
        labelColor={healthLabel.color}
        description='Hạng mục vượt ngân sách so với các hạng mục còn lại'
        warnText={overBudgetCount > 0 ? `${overBudgetCount} hạng mục vượt ngân sách` : undefined}
        segments={[
          { value: overBudgetCount, color: 'oklch(0.577 0.245 27.325)', label: 'Vượt ngân sách' },
          { value: withinBudgetCount, color: 'transparent', label: 'Còn lại' },
        ]}
      />
    </div>
  );
}
