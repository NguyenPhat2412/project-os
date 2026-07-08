'use client';

import { useMemo } from 'react';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';
import { Card, CardContent } from '@/components/ui/card';

interface WikiStatsPanelProps {
  wikiLinks: (WikiLink & { id: string })[];
}

export function WikiStatsPanel({ wikiLinks }: WikiStatsPanelProps) {
  const stats = useMemo(() => {
    const byTag: Record<string, number> = {};
    wikiLinks.forEach((w) => {
      w.tags?.forEach((t: string) => {
        byTag[t] = (byTag[t] ?? 0) + 1;
      });
    });
    const topTags = Object.entries(byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { total: wikiLinks.length, byTag, topTags };
  }, [wikiLinks]);

  if (wikiLinks.length === 0) return null;

  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs flex flex-wrap items-center gap-4'>
      <Card>
        <CardContent className='flex items-center gap-2'>
          <span className='font-mono-dm text-[12px] uppercase tracking-wider text-muted-foreground'>Wiki</span>
          <span className='text-[15px] font-bold text-primary'>{stats.total}</span>
        </CardContent>
      </Card>
      {stats.topTags.slice(0, 4).map(([tag, count]) => (
        <Card key={tag}>
          <CardContent className='flex items-center gap-1.5'>
            <span className='text-[12px] text-foreground'>{tag}</span>
            <span className='font-mono-dm text-[12px] text-muted-foreground'>{count}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
