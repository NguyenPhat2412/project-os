'use client';

import type { Bug, BugSeverity } from '@/modules/bugs/types/bug';
import { ScoreDonut } from '@/components/ui/shared/score-donut';
import { BreakdownBarChart } from '@/components/ui/shared/breakdown-bar-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BUG_SEVERITY_META } from '@/lib/constants/work-item-colors';

type BugWithId = Bug & { id: string };

const SEVERITY_CONFIG: { key: BugSeverity; label: string; color: string }[] = [
  { key: 'Critical', label: 'Critical', color: BUG_SEVERITY_META.Critical.chartColor },
  { key: 'High', label: 'High', color: BUG_SEVERITY_META.High.chartColor },
  { key: 'Medium', label: 'Medium', color: BUG_SEVERITY_META.Medium.chartColor },
  { key: 'Low', label: 'Low', color: BUG_SEVERITY_META.Low.chartColor },
];

function parseDate(ddmmyyyy: string): Date | null {
  if (!ddmmyyyy) return null;
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  const d = parseDate(deadline);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

interface Props {
  bugs: BugWithId[];
}

export function BugStatsPanel({ bugs }: Props) {
  const total = bugs.length;
  const open = bugs.filter((b) => b.status === 'open').length;
  const inProgress = bugs.filter((b) => b.status === 'in-progress').length;
  const inReview = bugs.filter((b) => b.status === 'in-review').length;
  const fixed = bugs.filter((b) => b.status === 'fixed').length;
  const wontFix = bugs.filter((b) => b.status === 'wont-fix').length;
  const fixRate = total > 0 ? Math.round((fixed / total) * 100) : 0;
  const criticalOpen = bugs.filter((b) => b.severity === 'Critical' && b.status === 'open').length;

  const overdueOpen = bugs.filter((b) => b.status !== 'fixed' && b.status !== 'wont-fix' && isOverdue(b.deadline)).length;

  const STATUS_WEIGHT: Record<string, number> = { open: 1, 'in-progress': 0.5, 'in-review': 0.25 };
  const SEVERITY_WEIGHT: Record<string, number> = { Critical: 15, High: 8, Medium: 3, Low: 1 };
  const penalty = bugs.reduce((acc, b) => acc + (STATUS_WEIGHT[b.status] ?? 0) * (SEVERITY_WEIGHT[b.severity] ?? 0), 0);
  const qualityScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const qualityLabel =
    qualityScore >= 90
      ? { text: 'Xuất sắc', color: 'oklch(0.646 0.222 142.116)' }
      : qualityScore >= 70
        ? { text: 'Tốt', color: 'var(--primary)' }
        : qualityScore >= 50
          ? { text: 'Trung bình', color: '#f59e0b' }
          : { text: 'Cần cải thiện', color: 'oklch(0.577 0.245 27.325)' };

  const severityItems = SEVERITY_CONFIG.map((s) => ({
    name: s.label,
    value: bugs.filter((b) => b.severity === s.key).length,
    color: s.color,
  }));

  const statusItems = [
    { name: 'Open', value: open, color: 'oklch(0.577 0.245 27.325)' },
    { name: 'In Progress', value: inProgress, color: 'var(--primary)' },
    { name: 'In Review', value: inReview, color: '#f59e0b' },
    { name: 'Fixed', value: fixed, color: 'oklch(0.646 0.222 142.116)' },
    { name: "Won't Fix", value: wontFix, color: 'var(--muted)' },
  ];

  const summaryCards = [
    { label: 'Tổng bugs', value: total, sub: 'Tất cả trạng thái', color: 'var(--foreground)' },
    { label: 'Đang mở', value: open, sub: `${inProgress} đang xử lý`, color: 'oklch(0.577 0.245 27.325)' },
    { label: 'Critical mở', value: criticalOpen, sub: 'Cần xử lý ngay', color: criticalOpen > 0 ? BUG_SEVERITY_META.Critical.chartColor : BUG_SEVERITY_META.Low.chartColor },
    { label: 'Đã fix', value: `${fixRate}%`, sub: `${fixed}/${total} bugs`, color: fixRate >= 70 ? 'oklch(0.646 0.222 142.116)' : 'var(--primary)' },
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

      <BreakdownBarChart title='Theo mức độ' items={severityItems} />
      <BreakdownBarChart title='Theo trạng thái' items={statusItems} />

      <ScoreDonut
        title='Chất lượng dự án'
        label={qualityLabel.text}
        labelColor={qualityLabel.color}
        description='Bug quá deadline chưa hoàn thành so với các bug còn lại'
        warnText={overdueOpen > 0 ? `${overdueOpen} bug quá deadline` : undefined}
        segments={[
          { value: overdueOpen, color: 'oklch(0.577 0.245 27.325)', label: 'Quá deadline' },
          { value: total - overdueOpen, color: 'transparent', label: 'Còn lại' },
        ]}
      />
    </div>
  );
}
