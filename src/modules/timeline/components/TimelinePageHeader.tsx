'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

export function TimelinePageHeader() {
  return (
    <PageHeader
      title='Timeline'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.timeline)}
    />
  );
}
