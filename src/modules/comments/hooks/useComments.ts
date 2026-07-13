'use client';

import { useMemo } from 'react';
import { createCommentsCollection } from '@/modules/comments/collections/comments';
import type { CommentEntityType, CommentThread } from '@/modules/comments/types/comment';
import type { WithId } from '@/lib/api-rq';
import type { Comment } from '@/modules/comments/types/comment';

interface UseCommentsOptions {
  entityType: CommentEntityType;
  entityId: string;
}

export function useComments({ entityType, entityId }: UseCommentsOptions) {
  // Each entity has its own scoped subcollection — no where clauses needed
  const collection = useMemo(
    () => createCommentsCollection(entityType, entityId),
    [entityType, entityId],
  );

  const { data: raw = [], isLoading } = collection.useList(
    { orderBy: { field: 'createdAt', direction: 'asc' } },
    { staleTime: 0, refetchInterval: 10_000 },
  ) as unknown as { data: WithId<Comment>[]; isLoading: boolean };

  /** Group flat list into top-level threads with inline replies */
  const threads = useMemo<CommentThread[]>(() => {
    const topLevel = raw.filter((c: WithId<Comment>) => !c.parentId);
    return topLevel.map((comment: WithId<Comment>) => ({
      comment,
      replies: raw.filter((c: WithId<Comment>) => c.parentId === comment.id),
    }));
  }, [raw]);

  const createComment = collection.useCreate();
  const updateComment = collection.useUpdate();
  const deleteComment = collection.useDelete();

  return {
    threads,
    totalCount: raw.length,
    isLoading,
    createComment,
    updateComment,
    deleteComment,
  };
}
