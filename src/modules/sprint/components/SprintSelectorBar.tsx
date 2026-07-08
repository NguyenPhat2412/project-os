'use client';

import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Sprint } from '@/modules/sprint/types/sprint';
import { SprintStatusBadge } from './SprintStatusBadge';

interface Props {
  sprints: (Sprint & { id: string })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function SprintSelectorBar({ sprints, selectedId, onSelect, onCreate }: Props) {
  const viewedSprint = sprints.find((s) => s.id === selectedId) ?? sprints[0];

  return (
    <div className='flex items-center gap-2 mb-5 flex-wrap'>
      <div className='flex items-center gap-1 bg-card border border-border panel p-1 flex-wrap'>
        {sprints.map((s) => {
          const isViewed = s.id === viewedSprint?.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={['flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors', isViewed ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'].join(' ')}
            >
              <span className='w-1.5 h-1.5 rounded-full shrink-0' style={{ background: isViewed ? 'white' : '#6b7280' }} />
              {s.name}
            </button>
          );
        })}
      </div>

      <Button onClick={onCreate} size='sm' className='ml-auto h-9 gap-1.5'>
        <PlusIcon size={14} /> Tạo Sprint
      </Button>
    </div>
  );
}
