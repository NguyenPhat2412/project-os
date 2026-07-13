// collections/docActivity.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

export interface DocActivity {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
}

/**
 * DocActivity subcollection: projects/{ACTIVE_PROJECT_ID}/doc_activity
 */
export const docActivityCollection = createSubcollection<DocActivity>({
  path: (projectId: string) => `projects/${projectId}/doc_activity`,
  transform: (raw): WithId<DocActivity> => raw as unknown as WithId<DocActivity>,
})(ACTIVE_PROJECT_ID);
