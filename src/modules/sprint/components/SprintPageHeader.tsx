'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

export function SprintPageHeader() {
  return (
    <PageHeader
      title='Sprint Board'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.sprints)}
    />
  );
}
