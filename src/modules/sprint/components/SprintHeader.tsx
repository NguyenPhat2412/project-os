'use client';

import { PlayIcon, CheckCheckIcon, ListPlusIcon, PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SprintStatusBadge } from './SprintStatusBadge';
import { formatDateVi } from '@/lib/dayjs';
import type { Sprint } from '@/modules/sprint/types/sprint';

interface Props {
  sprint: Sprint & { id: string };
  taskCount: number;
  doneCount: number;
  bugCount: number;
  progressPct: number;
  onStart: () => void;
  onComplete: () => void;
  onAddTasks: () => void;
  onEdit: () => void;
  transitioning: boolean;
}

export function SprintHeader({ sprint, taskCount, doneCount, bugCount, progressPct, onStart, onComplete, onAddTasks, onEdit, transitioning }: Props) {
  return (
    <>
      {/* Sprint header card */}
      <div className='bg-card border border-border panel p-[18px_20px] mb-4'>
        <div className='flex flex-wrap items-start gap-4 justify-between'>
          <div className='flex flex-wrap items-start gap-6'>
            {/* Name + status */}
            <div>
              <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] mb-1'>Sprint</div>
              <div className='flex items-center gap-2'>
                <span className='font-sans text-[18px] font-bold'>{sprint.name}</span>
                <SprintStatusBadge status={sprint.status} />
              </div>
            </div>

            {/* Dates */}
            <div>
              <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] mb-1'>Thời gian</div>
              <div className='text-[13px] text-muted-foreground'>
                {formatDateVi(sprint.startDate, 'YYYY-MM-DD')} — {formatDateVi(sprint.endDate, 'YYYY-MM-DD')}
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] mb-1'>Tiến độ</div>
              <div className='flex items-center gap-2'>
                <div className='w-28 h-1.5 bg-secondary rounded-full overflow-hidden'>
                  <div className='h-full bg-primary rounded-full transition-all' style={{ width: `${progressPct}%` }} />
                </div>
                <span className='text-[12px] text-muted-foreground font-mono-dm'>
                  {doneCount}/{taskCount} tasks · {bugCount} bugs
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2 shrink-0'>
            {sprint.status === 'planned' && (
              <Button size='sm' onClick={onStart} disabled={transitioning} className='gap-1.5 text-[12px]'>
                <PlayIcon size={12} /> Start Sprint
              </Button>
            )}
            {sprint.status === 'active' && (
              <Button size='sm' onClick={onComplete} disabled={transitioning} className='gap-1.5 text-[12px]'>
                <CheckCheckIcon size={12} /> Complete Sprint
              </Button>
            )}
            <Button size='sm' variant='outline' onClick={onAddTasks} className='h-8 border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-1.5 text-[12px]'>
              <ListPlusIcon size={12} /> Thêm Tasks
            </Button>
            <Button size='sm' variant='outline' onClick={onEdit} className='h-8 border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-1.5 text-[12px]'>
              <PencilIcon size={12} /> Chỉnh sửa
            </Button>
          </div>
        </div>
      </div>

      {/* Sprint goal */}
      <div className='bg-card border border-border panel p-[13px_20px] mb-5 text-[13px] text-muted-foreground'>
        <span className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] mr-2'>Sprint Goal:</span>
        {sprint.goal}
      </div>
    </>
  );
}
