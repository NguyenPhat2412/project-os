'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

export function ActivityPageHeader() {
  return (
    <PageHeader
      title='Hoạt động'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.activity)}
    />
  );
}
