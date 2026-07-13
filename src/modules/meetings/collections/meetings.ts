// collections/meetings.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Meeting } from '@/modules/meetings/types/meeting';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

/**
 * Meetings subcollection: projects/{ACTIVE_PROJECT_ID}/meetings
 */
export const meetingsCollection = createSubcollection<Meeting>({
  path: (projectId: string) => `projects/${projectId}/meetings`,
  transform: (raw): WithId<Meeting> => raw as unknown as WithId<Meeting>,
})(ACTIVE_PROJECT_ID);

/**
 * Meeting comments subcollection path:
 * projects/{ACTIVE_PROJECT_ID}/meetings/{meetingId}/comments
 */
export function getMeetingCommentsPath(meetingId: string): string {
  return `projects/${ACTIVE_PROJECT_ID}/meetings/${meetingId}/comments`;
}
