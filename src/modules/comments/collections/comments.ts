import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { Comment, CommentEntityType } from '@/modules/comments/types/comment';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

const entitySegment: Record<CommentEntityType, string> = {
  task: 'tasks',
  bug: 'bugs',
  meeting: 'meetings',
};

const transform = (raw: Comment & { id: string }): WithId<Comment> =>
  ({
    ...raw,
    createdAt: (raw.createdAt as { toDate?: () => Date } | null)?.toDate?.()?.toISOString() ?? raw.createdAt ?? '',
    editedAt: (raw.editedAt as { toDate?: () => Date } | null)?.toDate?.()?.toISOString() ?? raw.editedAt,
  }) as unknown as WithId<Comment>;

/**
 * Factory — returns a comments collection scoped to a specific task or bug.
 * Path: projects/{ACTIVE_PROJECT_ID}/tasks/{entityId}/comments
 *    or projects/{ACTIVE_PROJECT_ID}/bugs/{entityId}/comments
 */
export function createCommentsCollection(entityType: CommentEntityType, entityId: string) {
  return createSubcollection<Comment>({
    path: (projectId: string, id: string) =>
      `projects/${projectId}/${entitySegment[entityType]}/${id}/comments`,
    transform,
  })(ACTIVE_PROJECT_ID, entityId);
}
