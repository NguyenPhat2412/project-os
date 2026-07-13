// collections/wikiLinks.ts
import { createSubcollection } from '@/lib/api-rq';
import { toDate } from '@/lib/api-rq/utils/timestamp';
import type { WithId } from '@/lib/api-rq';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';
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
 * Wiki content owned by Knowledge service: projects/{ACTIVE_PROJECT_SCOPE}/wikis
 */
export const wikiLinksCollection = createSubcollection<WikiLink>({
  path: (projectId: string) => `projects/${projectId}/wikis`,
  transform: (raw): WithId<WikiLink> => {
    const updatedAt = raw.updatedAt ? toDate(raw.updatedAt) : null;
    const createdAt = raw.createdAt ? toDate(raw.createdAt) : null;
    return {
      ...raw,
      updatedAt: updatedAt ? updatedAt.toLocaleDateString('vi-VN') : undefined,
      createdAt: createdAt ? createdAt.toLocaleDateString('vi-VN') : undefined,
    } as unknown as WithId<WikiLink>;
  },
})(ACTIVE_PROJECT_SCOPE);
