'use client';

import { MeetingRow } from '@/modules/meetings/components/MeetingRow';
import type { Meeting } from '@/modules/meetings/types/meeting';

interface Props {
  meetings: (Meeting & { id: string })[];
  teamMembers: { id: string; initials: string; gradient: string }[];
  onView: (m: Meeting & { id: string }) => void;
  onEdit: (m: Meeting & { id: string }) => void;
}

export function MeetingsSidebar({ meetings, teamMembers, onView, onEdit }: Props) {
  // Upcoming sorted by date/time
  const sortedMeetings = [...meetings].sort((a, b) => {
    const keyA = `${a.date ?? ''} ${a.time ?? ''}`;
    const keyB = `${b.date ?? ''} ${b.time ?? ''}`;
    return keyA.localeCompare(keyB);
  });

  return (
    <div className='space-y-4'>
      <div className='bg-card border border-border panel p-4'>
        <div className='font-sans text-[14px] font-bold mb-3'>Sắp tới</div>
        {sortedMeetings.length === 0 ? (
          <p className='text-[12px] text-muted-foreground'>Không có cuộc họp nào.</p>
        ) : (
          <div className='space-y-2'>
            {sortedMeetings.slice(0, 5).map((m) => {
              const attendees = (m.attendeeIds ?? [])
                .map((id) => teamMembers.find((tm) => tm.id === id))
                .filter(Boolean)
                .map((tm) => ({ initials: tm!.initials, color: tm!.gradient }));
              return (
                <MeetingRow
                  key={m.id}
                  day={m.day ? String(m.day) : ''}
                  month={m.month}
                  title={m.title}
                  time={m.time}
                  attendees={attendees}
                  badge={m.important ? { label: 'Quan trọng', variant: 'accent' } : undefined}
                  onView={() => onView(m)}
                  onEdit={() => onEdit(m)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
