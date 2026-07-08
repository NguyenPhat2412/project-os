'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

export function TeamPageHeader() {
  return (
    <PageHeader
      title='Nhóm'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.team)}
    />
  );
}
