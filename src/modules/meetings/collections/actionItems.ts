// collections/actionItems.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { PROJECT_ID } from '@/lib/project';

export interface ActionItem {
  id: string;
  label: string;
  assignee?: string;
  done: boolean;
}

/**
 * ActionItems subcollection: projects/{PROJECT_ID}/action_items
 */
export const actionItemsCollection = createSubcollection<ActionItem>({
  path: (projectId: string) => `projects/${projectId}/action_items`,
  transform: (raw): WithId<ActionItem> => raw as unknown as WithId<ActionItem>,
})(PROJECT_ID);
