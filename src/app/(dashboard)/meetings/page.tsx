'use client';
import { useState, useMemo } from 'react';
import { meetingsCollection } from '@/modules/meetings/collections/meetings';
import { PageLoader } from '@/components/ui/page-loader';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { teamCollection } from '@/modules/team/collections/team';
import { MeetingDialog } from '@/modules/meetings/components/MeetingDialog';
import { MeetingViewSheet } from '@/modules/meetings/components/MeetingViewSheet';
import { MeetingsPageHeader } from '@/modules/meetings/components/MeetingsPageHeader';
import { MeetingFilterBar } from '@/modules/meetings/components/MeetingFilterBar';
import { MeetingsContent } from '@/modules/meetings/components/MeetingsContent';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { TeamMember } from '@/modules/team/types/team';

type ViewMode = 'list' | 'card' | 'calendar';
const ALL = 'all' as const;

export default function MeetingsPage() {
  // ── Hooks: always called, in the same order on every render ──────────────

  // View + dialog state
  const [view, setView] = useState<ViewMode>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingMeeting, setViewingMeeting] = useState<(Meeting & { id: string }) | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<(Meeting & { id: string }) | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<(Meeting & { id: string }) | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>(ALL);
  const [filterAttendee, setFilterAttendee] = useState<string>(ALL);
  const [filterImportant, setFilterImportant] = useState<boolean | null>(null);

  // Data fetching
  const { data: meetingsData = [], isLoading: meetingsLoading } = meetingsCollection.useList();
  const { data: freshMeetingData } = meetingsCollection.useDocument(viewingMeeting?.id ?? null, { staleTime: 0 });
  const { data: freshEditingMeetingData } = meetingsCollection.useDocument(editingMeeting?.id ?? null, { staleTime: 0 });
  const deleteMeeting = meetingsCollection.useDelete();
  const { data: batchData, isLoading: batchLoading } = useBatchFetch([createCollectionListItem('teamMembers', teamCollection)]);

  // Derive state (no hook) — safe after all hooks above
  const meetings = meetingsData as (Meeting & { id: string })[];
  const teamMembers = (batchData.teamMembers ?? []) as TeamMember[];
  const loading = meetingsLoading || batchLoading;

  // Filtered meetings (useMemo after all hooks, before conditional return)
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase()) || m.location?.toLowerCase().includes(search.toLowerCase());

      const matchMonth = filterMonth === ALL || `${m.month}/${m.year}` === filterMonth;

      const matchAttendee = filterAttendee === ALL || m.attendeeIds?.includes(filterAttendee);

      const matchImportant = filterImportant === null || (m.important ?? false) === filterImportant;

      return matchSearch && matchMonth && matchAttendee && matchImportant;
    });
  }, [meetings, search, filterMonth, filterAttendee, filterImportant]);

  // ── Early return AFTER all hooks ──────────────────────────────────────────
  if (loading) {
    return <PageLoader />;
  }

  // ── Derived values from data ─────────────────────────────────────────────
  const nextId = (() => {
    const nums = meetings.map((m) => parseInt(m.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `M-${String(next).padStart(2, '0')}`;
  })();

  const allNotes = meetings.flatMap((m) => m.notes ?? []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingMeeting(null);
    setDialogOpen(true);
  };
  const openEdit = (meeting: Meeting & { id: string }) => {
    setEditingMeeting(meeting);
    setDialogOpen(true);
  };

  return (
    <div className='space-y-4'>
      <MeetingsPageHeader meetingCount={meetings.length} noteCount={allNotes.length} />

      {/* ── Filter bar ── */}
      <MeetingFilterBar
        search={search}
        onSearchChange={setSearch}
        filterMonth={filterMonth}
        onMonthChange={setFilterMonth}
        filterAttendee={filterAttendee}
        onAttendeeChange={setFilterAttendee}
        filterImportant={filterImportant}
        onImportantChange={setFilterImportant}
        meetings={meetings}
        teamMembers={teamMembers}
        view={view}
        onViewChange={setView}
        onCreate={openCreate}
        filteredCount={filteredMeetings.length}
      />

      <MeetingsContent meetings={filteredMeetings} teamMembers={teamMembers} view={view} onViewChange={setView} onView={setViewingMeeting} onEdit={openEdit} onDelete={setDeletingMeeting} />

      <MeetingDialog open={dialogOpen} meeting={(freshEditingMeetingData as (Meeting & { id: string }) | null) ?? editingMeeting} nextId={nextId} teamMembers={teamMembers} onClose={() => setDialogOpen(false)} onSuccess={() => {}} />

      <MeetingViewSheet
        open={!!viewingMeeting}
        meeting={(freshMeetingData as (Meeting & { id: string }) | null) ?? viewingMeeting}
        teamMembers={teamMembers}
        onClose={() => setViewingMeeting(null)}
        onEdit={() => {
          if (viewingMeeting) {
            openEdit(viewingMeeting);
            setViewingMeeting(null);
          }
        }}
        onDelete={() => {
          if (viewingMeeting) {
            setDeletingMeeting(viewingMeeting);
            setViewingMeeting(null);
          }
        }}
      />

      {deletingMeeting && (
        <ConfirmDialog
          danger
          title='Xoá cuộc họp'
          message={`Bạn có chắc muốn xoá "${deletingMeeting.title}"? Hành động này không thể hoàn tác.`}
          confirmLabel='Xoá'
          onCancel={() => setDeletingMeeting(null)}
          onConfirm={async () => {
            await deleteMeeting.mutateAsync(deletingMeeting.id);
            setDeletingMeeting(null);
          }}
        />
      )}
    </div>
  );
}
