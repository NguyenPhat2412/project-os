// collections/wikiLinks.ts
import { createSubcollection } from '@/lib/firestore-rq';
import { toDate } from '@/lib/firestore-rq/utils/timestamp';
import type { WithId } from '@/lib/firestore-rq';
import { ACTIVE_PROJECT_ID } from '@/lib/project';
import type { Attachment } from '@/lib/types/attachment';

export interface WikiLink {
  id: string;
  title: string;
  icon: string;
  summary?: string;
  content?: string;
  updatedAt?: string;
  createdAt?: string;
  tags?: string[];
  url?: string;
  order?: number;
  attachments?: Attachment[];
}

/**
 * WikiLinks subcollection: projects/{ACTIVE_PROJECT_ID}/wiki_links
 */
export const wikiLinksCollection = createSubcollection<WikiLink>({
  path: (projectId: string) => `projects/${projectId}/wiki_links`,
  transform: (raw): WithId<WikiLink> => {
    const updatedAt = raw.updatedAt ? toDate(raw.updatedAt) : null;
    const createdAt = raw.createdAt ? toDate(raw.createdAt) : null;
    return {
      ...raw,
      updatedAt: updatedAt ? updatedAt.toLocaleDateString('vi-VN') : undefined,
      createdAt: createdAt ? createdAt.toLocaleDateString('vi-VN') : undefined,
    } as unknown as WithId<WikiLink>;
  },
})(ACTIVE_PROJECT_ID);
