'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

export function DashboardPageHeader() {
  return (
    <PageHeader
      title='Dashboard'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.dashboard)}
    />
  );
}
