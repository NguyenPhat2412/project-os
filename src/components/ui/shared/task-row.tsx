'use client';

import { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBadge } from '@/components/ui/page-badge';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

type Priority = 'High' | 'Normal' | 'Low';

interface TaskRowProps {
  label: string;
  done?: boolean;
  priority?: Priority;
}

export function TaskRow({ label, done: initDone = false, priority }: TaskRowProps) {
  const [done, setDone] = useState(initDone);

  return (
    <div className='flex items-center gap-2.5 py-2.5 border-b border-border last:border-b-0'>
      <Button
        variant='ghost'
        size='icon-xs'
        onClick={() => setDone(!done)}
        className={cn(
          'w-4.5 h-4.5 rounded-1.25 border-2 shrink-0 transition-all p-0',
          done ? 'bg-green-500 border-green-500 text-black hover:bg-green-500 hover:opacity-90' : 'border-foreground/20 bg-transparent text-transparent hover:border-primary',
        )}
      >
        {done && <CheckIcon size={10} strokeWidth={3} />}
      </Button>
      <span className={cn('flex-1 text-[13.5px]', done && 'line-through text-muted-foreground')}>{label}</span>
      {priority && <PageBadge variant={TASK_PRIORITY_META[priority].badgeVariant}>{priority}</PageBadge>}
    </div>
  );
}
