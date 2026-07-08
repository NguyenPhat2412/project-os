'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { buildBreadcrumb } from '@/lib/breadcrumbs';
import type { BreadcrumbSegment } from '@/lib/breadcrumbs';

interface Props {
  title: string;
  summary?: string;
  segments: BreadcrumbSegment[];
  actions?: React.ReactNode;
}

export function SimplePageHeader({ title, summary, segments, actions }: Props) {
  return (
    <PageHeader
      title={title}
      summary={summary}
      breadcrumb={buildBreadcrumb(segments)}
      actions={actions}
    />
  );
}
