'use client';

import { StatCard } from '@/components/ui/shared/stat-card';

interface StatItem {
  label: string;
  value: string;
  icon?: string;
  trend?: string;
}

interface Props {
  stats: StatItem[];
}

export function ReportsStatsGrid({ stats }: Props) {
  return (
    <div className='grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4.5 mb-6'>
      {stats.map((s, i) => (
        <StatCard key={i} {...s} />
      ))}
    </div>
  );
}
