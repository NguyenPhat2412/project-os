'use client';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RiskPageHeaderProps {
  onCreate: () => void;
}

export function RiskPageHeader({ onCreate }: RiskPageHeaderProps) {
  return (
    <PageHeader
      title='Risk Register'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.risk)}
      actions={<Button onClick={onCreate} size='sm'><PlusIcon size={14} /> Thêm rủi ro</Button>}
    />
  );
}
