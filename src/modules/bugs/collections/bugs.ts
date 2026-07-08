import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Bug } from '@/modules/bugs/types/bug';
import { PROJECT_ID } from '@/lib/project';

/**
 * Bugs subcollection: projects/{PROJECT_ID}/bugs
 */
export const bugsCollection = createSubcollection<Bug>({
  path: (projectId: string) => `projects/${projectId}/bugs`,
  transform: (raw): WithId<Bug> => raw as unknown as WithId<Bug>,
})(PROJECT_ID);
