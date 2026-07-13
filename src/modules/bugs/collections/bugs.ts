import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Bug } from '@/modules/bugs/types/bug';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

/**
 * Bugs subcollection: projects/{ACTIVE_PROJECT_ID}/bugs
 */
export const bugsCollection = createSubcollection<Bug>({
  path: (projectId: string) => `projects/${projectId}/bugs`,
  transform: (raw): WithId<Bug> => raw as unknown as WithId<Bug>,
})(ACTIVE_PROJECT_ID);
