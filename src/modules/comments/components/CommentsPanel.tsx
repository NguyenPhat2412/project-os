'use client';

import { useState } from 'react';
import { MessageSquareIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useComments } from '@/modules/comments/hooks/useComments';
import { CommentThread } from './CommentThread';
import { CommentInput } from './CommentInput';
import type { Comment, CommentEntityType } from '@/modules/comments/types/comment';

interface Props {
  entityType: CommentEntityType;
  entityId: string;
}

/** Derive display info from Firebase Auth user (no team member required). */
function getAuthorInitials(displayName: string | null, email: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (email ?? '??').slice(0, 2).toUpperCase();
}

/** Stable gradient from uid hash (12 preset palettes). */
const GRADIENTS = [
  'linear-gradient(135deg,#6c63ff,#a855f7)',
  'linear-gradient(135deg,#22c55e,#16a34a)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#a855f7,#7c3aed)',
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f97316,#ea580c)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
  'linear-gradient(135deg,#ef4444,#b91c1c)',
];

function uidToGradient(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function CommentsPanel({ entityType, entityId }: Props) {
  const { user } = useAuth();
  const { threads, totalCount, isLoading, createComment, updateComment, deleteComment } = useComments({
    entityType,
    entityId,
  });

  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  if (!user) return null;

  const authorName = user.displayName || user.email || 'Người dùng';
  const authorInitials = getAuthorInitials(user.displayName, user.email);
  const authorGradient = uidToGradient(user.uid);

  const handleSubmit = async (content: string, parentId?: string) => {
    if (editingComment) {
      await updateComment.mutateAsync({
        id: editingComment.id,
        data: { content, editedAt: new Date().toISOString() } as never,
      });
      setEditingComment(null);
    } else {
      await createComment.mutateAsync({
        entityType,
        entityId,
        authorId: user.uid,
        authorName,
        authorInitials,
        authorGradient,
        content,
        createdAt: new Date().toISOString(),
        ...(parentId ? { parentId } : {}),
      } as never);
      setReplyingTo(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteComment.mutateAsync(id);
  };

  const handleEdit = (comment: Comment) => {
    setReplyingTo(null);
    setEditingComment(comment);
  };

  const handleReply = (comment: Comment) => {
    setEditingComment(null);
    setReplyingTo(comment);
  };

  return (
    <section className='space-y-4'>
      {/* Section header */}
      <div className='flex items-center gap-2'>
        <MessageSquareIcon size={13} className='text-muted-foreground' />
        <span className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-wider'>Bình luận {totalCount > 0 ? `(${totalCount})` : ''}</span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className='space-y-4'>
          {[1, 2].map((i) => (
            <div key={i} className='flex gap-2.5 animate-pulse'>
              <div className='w-7 h-7 rounded-full bg-secondary shrink-0' />
              <div className='flex-1 space-y-1.5'>
                <div className='h-2.5 w-24 rounded bg-secondary' />
                <div className='h-2 w-full rounded bg-secondary' />
                <div className='h-2 w-3/4 rounded bg-secondary' />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && threads.length === 0 && <p className='text-[12px] text-muted-foreground italic'>Chưa có bình luận nào. Hãy là người đầu tiên!</p>}

      {/* Threads */}
      {!isLoading && threads.length > 0 && (
        <div className='space-y-4'>
          {threads.map((thread) => (
            <CommentThread key={thread.comment.id} thread={thread} currentAuthorId={user.uid} onReply={handleReply} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Input */}
      <CommentInput
        authorInitials={authorInitials}
        authorGradient={authorGradient}
        replyingTo={replyingTo ?? undefined}
        editingComment={editingComment ?? undefined}
        onSubmit={handleSubmit}
        onCancelReply={() => setReplyingTo(null)}
        onCancelEdit={() => setEditingComment(null)}
      />
    </section>
  );
}
