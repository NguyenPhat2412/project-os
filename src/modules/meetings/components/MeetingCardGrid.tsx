'use client';
import { CalendarIcon, MapPinIcon } from 'lucide-react';
import { PageBadge } from '@/components/ui/page-badge';
import { Avatar } from '@/components/ui/avatar';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';

type MeetingWithId = Meeting & { id: string };

interface Props {
  meetings: MeetingWithId[];
  teamMembers: TeamMember[];
  onView: (meeting: MeetingWithId) => void;
  onEdit: (meeting: MeetingWithId) => void;
  onDelete?: (meeting: MeetingWithId) => void;
}

export function MeetingCardGrid({ meetings, teamMembers, onView, onEdit, onDelete }: Props) {
  if (meetings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground'>
        <CalendarIcon size={32} />
        <p className='font-sans text-[15px]'>Chưa có cuộc họp nào.</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
      {meetings.map((meeting) => {
        const attendees = (meeting.attendeeIds ?? []).map((id) => teamMembers.find((tm) => tm.id === id)).filter(Boolean) as TeamMember[];

        return (
          <div key={meeting.id} onClick={() => onView(meeting)} className='bg-card border border-border panel p-4 cursor-pointer hover:border-foreground/20 hover:bg-secondary transition-colors group'>
            {/* Date + time */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-2'>
                <div className='bg-primary/10 border border-primary/20 rounded-sm px-2 py-1 text-center min-w-12'>
                  <div className='font-mono-dm text-[12px] font-bold text-primary'>{meeting.day}</div>
                  <div className='font-mono-dm text-[9px] text-muted-foreground'>{meeting.month}</div>
                </div>
                <div>
                  <div className='text-[13px] font-semibold'>{meeting.time}</div>
                  <div className='text-[12px] text-muted-foreground'>{meeting.year}</div>
                </div>
              </div>
              {meeting.important && <PageBadge variant='accent'>Quan trọng</PageBadge>}
            </div>

            {/* Title */}
            <h3 className='text-[14px] font-semibold mb-2 line-clamp-2'>{meeting.title}</h3>

            {/* Description */}
            {meeting.description && <p className='text-[12px] text-muted-foreground mb-3 line-clamp-2'>{meeting.description}</p>}

            {/* Location */}
            {meeting.location && (
              <div className='flex items-center gap-1.5 mb-3'>
                <MapPinIcon size={11} className='text-muted-foreground' />
                <span className='text-[12px] text-muted-foreground truncate'>{meeting.location}</span>
              </div>
            )}

            {/* Attendees */}
            <div className='flex items-center justify-between'>
              <div className='flex -space-x-1.5'>
                {attendees.slice(0, 5).map((a) => (
                  <Avatar key={a.id} initials={a.initials} gradient={a.gradient} size='sm' className='ring-1 ring-card' />
                ))}
                {attendees.length > 5 && <div className='w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] text-muted-foreground'>+{attendees.length - 5}</div>}
              </div>

              {/* Actions */}
              <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(meeting);
                  }}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <PencilIcon size={12} />
                </Button>
                {onDelete && (
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(meeting);
                    }}
                    className='text-muted-foreground hover:text-red-500'
                  >
                    <Trash2Icon size={12} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
