// collections/activityFeed.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { ActivityEntry } from '@/modules/activity/types/activity';
import { PROJECT_ID } from '@/lib/project';

/**
 * ActivityFeed subcollection: projects/{PROJECT_ID}/activity_feed
 */
export const activityFeedCollection = createSubcollection<ActivityEntry>({
  path: (projectId: string) => `projects/${projectId}/activity_feed`,
  transform: (raw): WithId<ActivityEntry> => raw as unknown as WithId<ActivityEntry>,
})(PROJECT_ID);
