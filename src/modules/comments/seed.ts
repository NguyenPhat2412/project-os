/**
 * seed.ts — Comments module
 * ───────────────────────────
 * Seed comments for tasks, bugs, meetings, etc.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { comments as mockComments } from '@/modules/comments/mock';
import type { CommentEntityType } from '@/modules/comments/types/comment';

const ENTITY_SEGMENT: Record<CommentEntityType, string> = {
  task: 'tasks',
  bug: 'bugs',
  meeting: 'meetings',
};

export async function seedComments(): Promise<{ created: number }> {
  const byEntity = new Map<string, { entityType: CommentEntityType; entityId: string; items: typeof mockComments }>();

  for (const comment of mockComments) {
    const key = `${comment.entityType}:${comment.entityId}`;
    if (!byEntity.has(key)) {
      byEntity.set(key, { entityType: comment.entityType, entityId: comment.entityId, items: [] });
    }
    byEntity.get(key)!.items.push(comment);
  }

  let created = 0;

  for (const { entityType, entityId, items } of byEntity.values()) {
    const col = collection(db, `projects/default/${ENTITY_SEGMENT[entityType]}/${entityId}/comments`);
    const snap = await getDocs(col);
    if (snap.size > 0) continue;

    for (const comment of items) {
      const { id, ...data } = comment;
      await setDoc(doc(col, id), data);
    }
    created += items.length;
  }

  if (created > 0) console.log(`💬 Seeded ${created} comments`);
  return { created };
}
