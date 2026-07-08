'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

interface BugPageHeaderProps {
  totalBugs: number;
  openBugs: number;
}

export function BugPageHeader({ totalBugs, openBugs }: BugPageHeaderProps) {
  return (
    <PageHeader
      title='Bug Tracker'
      summary={`${totalBugs} bugs · ${openBugs} đang mở`}
      breadcrumb={buildBreadcrumb(BREADCRUMBS.bugs)}
    />
  );
}
