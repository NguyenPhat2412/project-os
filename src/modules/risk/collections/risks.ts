// collections/risks.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Risk } from '@/modules/risk/types/risk';
import { PROJECT_ID } from '@/lib/project';

/**
 * Risks subcollection: projects/{PROJECT_ID}/risks
 */
export const risksCollection = createSubcollection<Risk>({
  path: (projectId: string) => `projects/${projectId}/risks`,
  transform: (raw): WithId<Risk> => raw as unknown as WithId<Risk>,
})(PROJECT_ID);
