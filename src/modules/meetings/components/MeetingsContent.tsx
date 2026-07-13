'use client';
import type { Meeting, MeetingNote } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';
import { MeetingListView } from './MeetingListView';
import { MeetingCalendarView } from './MeetingCalendarView';
import { MeetingCardGrid } from './MeetingCardGrid';
import { MeetingsSidebar } from './MeetingsSidebar';
import { MeetingNotesList } from './MeetingNotesList';

type ViewMode = 'list' | 'card' | 'calendar';

interface MeetingsContentProps {
  meetings: (Meeting & { id: string })[];
  teamMembers: TeamMember[];
  view: ViewMode;
  onView: (m: Meeting & { id: string }) => void;
  onEdit: (m: Meeting & { id: string }) => void;
  onDelete: (m: Meeting & { id: string }) => void;
}

export function MeetingsContent({ meetings, teamMembers, view, onView, onEdit, onDelete }: MeetingsContentProps) {
  const allNotes: MeetingNote[] = meetings.flatMap((m) => m.notes ?? []);

  // Card view: full-width, no sidebar
  if (view === 'card') {
    return (
      <div>
        <MeetingCardGrid meetings={meetings} teamMembers={teamMembers} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        <MeetingNotesList notes={allNotes} />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Main 2-col layout (list / calendar + sidebar) */}
      <div className='grid grid-cols-[2fr_1fr] max-lg:grid-cols-1 gap-5'>
        {view === 'list' ? <MeetingListView meetings={meetings} teamMembers={teamMembers} onView={onView} onEdit={onEdit} onDelete={onDelete} /> : <MeetingCalendarView meetings={meetings} onView={onView} />}
        <MeetingsSidebar meetings={meetings} teamMembers={teamMembers as { id: string; initials: string; gradient: string }[]} onView={onView} onEdit={onEdit} />
      </div>

      {/* Notes below */}
      <MeetingNotesList notes={allNotes} />
    </div>
  );
}
