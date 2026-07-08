// collections/milestones.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { PROJECT_ID } from '@/lib/project';

export interface Milestone {
  id: string;
  name: string;
  date: string;
  status: string;
  ownerId: string; // ref → team_members/{id}
}

/**
 * Milestones subcollection: projects/{PROJECT_ID}/milestones
 */
export const milestonesCollection = createSubcollection<Milestone>({
  path: (projectId: string) => `projects/${projectId}/milestones`,
  transform: (raw): WithId<Milestone> => raw as unknown as WithId<Milestone>,
})(PROJECT_ID);
