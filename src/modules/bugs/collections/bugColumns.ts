import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { BugColumn } from '@/modules/bugs/types/bug';
import { PROJECT_ID } from '@/lib/project';

/**
 * BugColumns subcollection: projects/{PROJECT_ID}/bug_columns
 */
export const bugColumnsCollection = createSubcollection<BugColumn>({
  path: (projectId: string) => `projects/${projectId}/bug_columns`,
  transform: (raw): WithId<BugColumn> => raw as unknown as WithId<BugColumn>,
})(PROJECT_ID);
