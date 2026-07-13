// collections/milestones.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

export interface Milestone {
  id: string;
  name: string;
  date: string;
  status: string;
  ownerId: string; // ref → team_members/{id}
}

/**
 * Milestones subcollection: projects/{ACTIVE_PROJECT_SCOPE}/milestones
 */
export const milestonesCollection = createSubcollection<Milestone>({
  path: (projectId: string) => `projects/${projectId}/milestones`,
  transform: (raw): WithId<Milestone> => raw as unknown as WithId<Milestone>,
})(ACTIVE_PROJECT_SCOPE);
