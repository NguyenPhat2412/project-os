// collections/documents.ts
import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Attachment } from '@/lib/types/attachment';
import { PROJECT_ID } from '@/lib/project';

export interface DocEntry {
  id: string;
  icon: string;
  name: string;
  type: string;
  size: string;
  date: string;
  badge: { label: string; variant: 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted' };
  folderId?: string;
  downloadUrl?: string;
  storagePath?: string;
  attachments?: Attachment[];
}

export type DocWithId = WithId<DocEntry>;

/**
 * Documents subcollection: projects/{PROJECT_ID}/documents
 */
export const documentsCollection = createSubcollection<DocEntry>({
  path: (projectId: string) => `projects/${projectId}/documents`,
  transform: (raw): WithId<DocEntry> => raw as unknown as WithId<DocEntry>,
})(PROJECT_ID);
