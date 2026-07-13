// collections/meetings.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { Meeting } from '@/modules/meetings/types/meeting';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

/**
 * Meetings subcollection: projects/{ACTIVE_PROJECT_SCOPE}/meetings
 */
export const meetingsCollection = createSubcollection<Meeting>({
  path: (projectId: string) => `projects/${projectId}/meetings`,
  transform: (raw): WithId<Meeting> => raw as unknown as WithId<Meeting>,
})(ACTIVE_PROJECT_SCOPE);

/**
 * Meeting comments subcollection path:
 * projects/{ACTIVE_PROJECT_SCOPE}/meetings/{meetingId}/comments
 */
export function getMeetingCommentsPath(meetingId: string): string {
  return `projects/${ACTIVE_PROJECT_SCOPE}/meetings/${meetingId}/comments`;
}
