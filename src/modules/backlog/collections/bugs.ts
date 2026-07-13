// collections/bugs.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

export interface Bug {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  assignee: string;
  sprint: string;
}

/**
 * Bugs subcollection: projects/{ACTIVE_PROJECT_ID}/bugs
 */
export const bugsCollection = createSubcollection<Bug>({
  path: (projectId: string) => `projects/${projectId}/bugs`,
  transform: (raw): WithId<Bug> => raw as unknown as WithId<Bug>,
})(ACTIVE_PROJECT_ID);
