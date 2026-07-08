export type CommentEntityType = 'task' | 'bug' | 'meeting';

export interface Comment {
  id: string;
  entityType: CommentEntityType;
  entityId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorGradient: string;
  content: string;
  createdAt: string; // ISO string
  parentId?: string; // undefined = top-level; string = reply
  editedAt?: string; // ISO string, set on edit
}

/** Client-side grouped structure: one top-level comment + its direct replies */
export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}
