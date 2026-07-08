'use client';

import type { Risk, RiskLevel } from '@/modules/risk/types/risk';
import { ScoreDonut } from '@/components/ui/shared/score-donut';
import { BreakdownBarChart } from '@/components/ui/shared/breakdown-bar-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type RiskWithId = Risk & { id: string };

const LEVEL_CONFIG: { key: RiskLevel; label: string; color: string }[] = [
  { key: 'Critical', label: 'Critical', color: 'oklch(0.577 0.245 27.325)' },
  { key: 'High', label: 'High', color: '#f59e0b' },
  { key: 'Medium', label: 'Medium', color: 'var(--primary)' },
  { key: 'Low', label: 'Low', color: 'oklch(0.646 0.222 142.116)' },
];

function parseDate(ddmmyyyy: string): Date | null {
  if (!ddmmyyyy) return null;
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  const d = parseDate(dueDate);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

interface Props {
  risks: RiskWithId[];
}

export function RiskStatsPanel({ risks }: Props) {
  const total = risks.length;
  const mitigated = risks.filter((r) => r.status === 'Đã giảm thiểu').length;
  const watching = risks.filter((r) => r.status === 'Đang theo dõi').length;
  const handling = risks.filter((r) => r.status === 'Đang xử lý').length;
  const mitigationRate = total > 0 ? Math.round((mitigated / total) * 100) : 0;
  const criticalOpen = risks.filter((r) => r.level === 'Critical' && r.status !== 'Đã giảm thiểu').length;
  const openCount = total - mitigated;

  const overdueUnmitigated = risks.filter((r) => r.status !== 'Đã giảm thiểu' && isOverdue(r.dueDate)).length;

  const penalty =
    risks.filter((r) => r.level === 'Critical' && r.status !== 'Đã giảm thiểu').length * 15 +
    risks.filter((r) => r.level === 'High' && r.status !== 'Đã giảm thiểu').length * 8 +
    risks.filter((r) => r.level === 'Medium' && r.status !== 'Đã giảm thiểu').length * 3 +
    risks.filter((r) => r.level === 'Low' && r.status !== 'Đã giảm thiểu').length * 1 +
    overdueUnmitigated * 5;

  const qualityScore = Math.max(0, Math.min(100, 100 - penalty));
  const qualityLabel =
    qualityScore >= 90
      ? { text: 'Xuất sắc', color: 'oklch(0.646 0.222 142.116)' }
      : qualityScore >= 70
        ? { text: 'Tốt', color: 'var(--primary)' }
        : qualityScore >= 50
          ? { text: 'Trung bình', color: '#f59e0b' }
          : { text: 'Cần cải thiện', color: 'oklch(0.577 0.245 27.325)' };

  const levelItems = LEVEL_CONFIG.map((l) => ({
    name: l.label,
    value: risks.filter((r) => r.level === l.key).length,
    color: l.color,
  }));

  const statusItems = [
    { name: 'Đang xử lý', value: handling, color: 'var(--primary)' },
    { name: 'Đang theo dõi', value: watching, color: '#f59e0b' },
    { name: 'Đã giảm thiểu', value: mitigated, color: 'oklch(0.646 0.222 142.116)' },
  ];

  const summaryCards = [
    { label: 'Tổng rủi ro', value: total, sub: 'Tất cả mức độ', color: 'var(--foreground)' },
    { label: 'Đang mở', value: openCount, sub: `${watching} theo dõi · ${handling} đang xử lý`, color: openCount > 0 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.646 0.222 142.116)' },
    { label: 'Critical mở', value: criticalOpen, sub: 'Cần xử lý ngay', color: criticalOpen > 0 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.646 0.222 142.116)' },
    { label: 'Đã giảm thiểu', value: `${mitigationRate}%`, sub: `${mitigated}/${total} rủi ro`, color: mitigationRate >= 70 ? 'oklch(0.646 0.222 142.116)' : 'var(--primary)' },
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

      <BreakdownBarChart title='Theo mức độ' items={levelItems} />
      <BreakdownBarChart title='Theo trạng thái' items={statusItems} />

      <ScoreDonut
        title='Quản lý rủi ro'
        label={qualityLabel.text}
        labelColor={qualityLabel.color}
        description='Rủi ro quá hạn chưa giảm thiểu so với các rủi ro còn lại'
        warnText={overdueUnmitigated > 0 ? `${overdueUnmitigated} rủi ro quá hạn` : undefined}
        segments={[
          { value: overdueUnmitigated, color: 'oklch(0.577 0.245 27.325)', label: 'Quá hạn' },
          { value: total - overdueUnmitigated, color: 'transparent', label: 'Còn lại' },
        ]}
      />
    </div>
  );
}
