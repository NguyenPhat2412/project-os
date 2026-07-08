'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

export function BudgetPageHeader() {
  return (
    <PageHeader
      title='Ngân sách'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.budget)}
    />
  );
}
