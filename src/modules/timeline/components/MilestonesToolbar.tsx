'use client';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestonesToolbarProps {
  onCreate: () => void;
}

export function MilestonesToolbar({ onCreate }: MilestonesToolbarProps) {
  return (
    <div className='flex items-center justify-between mb-3'>
      <div />
      <Button onClick={onCreate} className='gap-1.5 h-9'>
        <PlusIcon size={14} /> Thêm Milestone
      </Button>
    </div>
  );
}
