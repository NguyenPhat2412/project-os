'use client';

import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, buildBreadcrumb, BREADCRUMBS } from '@/components/layout/PageHeader';

interface Props {
  onCreate: () => void;
}

export function BacklogHeader({ onCreate }: Props) {
  return (
    <PageHeader
      title='Product Backlog'
      breadcrumb={buildBreadcrumb(BREADCRUMBS.backlog)}
      actions={
        <Button onClick={onCreate} className='gap-1.5 h-9'>
          <PlusIcon size={14} /> Thêm Epic
        </Button>
      }
    />
  );
}
