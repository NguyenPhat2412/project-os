'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { buildBreadcrumb, BREADCRUMBS } from '@/lib/breadcrumbs';

export function DocsPageHeader() {
  return (
    <PageHeader
      title='Tài liệu'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.docs)}
    />
  );
}
