// collections/documents.ts
import { createSubcollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { Attachment } from '@/lib/types/attachment';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

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
 * Documents subcollection: projects/{ACTIVE_PROJECT_SCOPE}/documents
 */
export const documentsCollection = createSubcollection<DocEntry>({
  path: (projectId: string) => `projects/${projectId}/documents`,
  transform: (raw): WithId<DocEntry> => {
    const value = raw as unknown as Record<string, unknown>;
    const badge = value.badge && typeof value.badge === 'object'
      ? value.badge as DocEntry['badge']
      : { label: 'Active', variant: 'accent' as const };

    return {
      ...(value as unknown as DocEntry),
      id: String(value.id ?? value.legacyId ?? ''),
      icon: String(value.icon ?? '📄'),
      name: String(value.name ?? value.title ?? 'Tài liệu chưa đặt tên'),
      type: String(value.type ?? 'Other'),
      size: String(value.size ?? '—'),
      date: String(value.date ?? value.updatedAt ?? value.createdAt ?? ''),
      badge,
      attachments: Array.isArray(value.attachments) ? value.attachments as Attachment[] : [],
    };
  },
})(ACTIVE_PROJECT_SCOPE);
