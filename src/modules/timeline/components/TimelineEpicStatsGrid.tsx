'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Epic } from '@/modules/backlog/types/backlog';

interface TimelineEpicStatsGridProps {
  epics: (Epic & { id: string })[];
}

export function TimelineEpicStatsGrid({ epics }: TimelineEpicStatsGridProps) {
  const epicStats = [
    {
      label: 'Tổng Epics',
      value: epics.length,
      sub: 'Tất cả giai đoạn',
    },
    {
      label: 'Hoàn thành',
      value: epics.filter((e) => e.status === 'Done').length,
      sub: 'Trạng thái Done',
    },
    {
      label: 'Đang thực hiện',
      value: epics.filter((e) => e.status === 'In Progress').length,
      sub: 'Trạng thái In Progress',
    },
    {
      label: 'Story Points',
      value: epics.reduce((s, e) => s + (e.storyPoints ?? 0), 0),
      sub: 'Tổng effort ước lượng',
    },
  ];

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {epicStats.map((s) => (
        <Card key={s.label}>
          <CardHeader className='pb-2'>
            <CardDescription className='text-xs'>{s.label}</CardDescription>
            <CardTitle className='text-xl font-semibold tabular-nums'>{s.value}</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <p className='text-[11px] text-muted-foreground'>{s.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
