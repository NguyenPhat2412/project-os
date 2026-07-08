'use client';
import { PageBadge } from '@/components/ui/page-badge';
import type { MeetingNote } from '@/modules/meetings/types/meeting';

interface Props {
  notes: MeetingNote[];
}

export function MeetingNotesList({ notes }: Props) {
  return (
    <div className='bg-card border border-border panel p-5 my-5'>
      <div className='font-sans text-[16px] font-bold mb-4'>Biên bản họp</div>
      {notes.map((n) => (
        <div key={n.id} className='flex items-center gap-3 py-2.75 border-b border-border last:border-b-0'>
          <div className='flex-1'>
            <div className='text-[13.5px] font-semibold'>{n.title}</div>
            <div className='font-mono-dm text-[12px] text-muted-foreground mt-0.5'>
              {n.date} · {n.author}
            </div>
          </div>
          <PageBadge variant='muted'>{n.actionCount} actions</PageBadge>
        </div>
      ))}
    </div>
  );
}
