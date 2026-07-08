import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import { PROJECT_ID } from '@/lib/project';

export interface FolderEntry {
  id: string;
  name: string;
  icon: string;
  parentId?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type FolderWithId = WithId<FolderEntry>;

export const foldersCollection = createSubcollection<FolderEntry>({
  path: (projectId: string) => `projects/${projectId}/folders`,
  transform: (raw): WithId<FolderEntry> => raw as unknown as WithId<FolderEntry>,
})(PROJECT_ID);
