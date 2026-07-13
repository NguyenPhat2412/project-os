/**
 * useMeetings
 * ────────────
 * Hook for Meetings module using api-rq collection pattern.
 * Meeting notes are now embedded inside Meeting documents.
 * Meeting comments live in a subcollection: projects/{PROJECT_ID}/meetings/{meetingId}/comments
 */

import { meetingsCollection } from '@/modules/meetings/collections/meetings';
import type { Meeting } from '@/modules/meetings/types/meeting';
import type { WithId } from '@/lib/api-rq';

export function useMeetings() {
  // ── API queries ─────────────────────────────────────────
  const { data: meetings = [], isLoading } = meetingsCollection.useList();

  // ── Type assertions ───────────────────────────────────────────
  const typedMeetings = meetings as WithId<Meeting>[];

  // ── CRUD mutations ────────────────────────────────────────────
  const createMeeting = meetingsCollection.useCreate();
  const updateMeeting = meetingsCollection.useUpdate();
  const deleteMeeting = meetingsCollection.useDelete();

  // ── Refresh ─────────────────────────────────────────────────
  const refresh = () => {
    // React Query tự invalidate sau mutation
  };

  return {
    meetings: typedMeetings,
    loading: isLoading,
    refresh,
    // CRUD
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
