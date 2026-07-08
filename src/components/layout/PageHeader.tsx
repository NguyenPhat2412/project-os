'use client';

import { cn } from '@/lib/utils';
import { BREADCRUMBS, buildBreadcrumb } from '@/lib/breadcrumbs';

export type { BreadcrumbSegment } from '@/lib/breadcrumbs';
export { BREADCRUMBS, buildBreadcrumb };

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  title: string;
  summary?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, summary, breadcrumb, actions, className }: Props) {
  return (
    <div className={cn('flex items-start justify-between mb-6 gap-4', className)}>
      {/* Left: title + summary + breadcrumb below title */}
      <div className='flex flex-col min-w-0'>
        <h1 className='text-[22px] font-bold leading-tight'>{title}</h1>
        {summary && <p className='text-[13px] text-muted-foreground mt-0.5'>{summary}</p>}
        {breadcrumb && <div className='mt-2'>{breadcrumb}</div>}
      </div>
      {/* Right: actions */}
      {actions && <div className='shrink-0 pt-0.5'>{actions}</div>}
    </div>
  );
}
