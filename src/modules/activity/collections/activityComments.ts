// collections/activityComments.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { PROJECT_ID } from '@/lib/project';

export interface ActivityComment {
  id: string;
  targetId: string;
  targetType: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

/**
 * ActivityComments subcollection: projects/{PROJECT_ID}/activity_comments
 */
export const activityCommentsCollection = createSubcollection<ActivityComment>({
  path: (projectId: string) => `projects/${projectId}/activity_comments`,
  transform: (raw): WithId<ActivityComment> => raw as unknown as WithId<ActivityComment>,
})(PROJECT_ID);
