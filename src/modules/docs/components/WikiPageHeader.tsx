'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { buildBreadcrumb, BREADCRUMBS } from '@/lib/breadcrumbs';

interface WikiPageHeaderProps {
  totalWikis: number;
}

export function WikiPageHeader({ totalWikis }: WikiPageHeaderProps) {
  return (
    <PageHeader
      title={`Wiki (${totalWikis})`}
      breadcrumb={buildBreadcrumb(BREADCRUMBS.wiki)}
    />
  );
}
