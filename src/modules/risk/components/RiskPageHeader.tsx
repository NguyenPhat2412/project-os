'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

interface RiskPageHeaderProps {
  onCreate: () => void;
}

export function RiskPageHeader({ onCreate }: RiskPageHeaderProps) {
  return <PageHeader title='Risk Register' breadcrumb={buildBreadcrumb(BREADCRUMBS.risk)} />;
}
