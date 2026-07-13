// collections/sprint.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Sprint } from '@/modules/sprint/types/sprint';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

/**
 * Sprints subcollection: projects/{ACTIVE_PROJECT_ID}/sprints
 */
export const sprintsCollection = createSubcollection<Sprint>({
  path: (projectId: string) => `projects/${projectId}/sprints`,
  transform: (raw): WithId<Sprint> => raw as unknown as WithId<Sprint>,
})(ACTIVE_PROJECT_ID);
