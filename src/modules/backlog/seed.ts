/**
 * seed.ts — Backlog module
 * ───────────────────────
 * Seed data and functions for epics (includes embedded user stories).
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { epics as mockEpics } from '@/modules/backlog/mock';

const EPICS_COL = collection(db, `projects/${PROJECT_ID}/epics`);

/**
 * Seed epics — creates/replaces sample epics with user stories.
 * Always overwrites to ensure mock data stays in sync.
 * Derives itemCount and storyPoints automatically from items[].
 */
export async function seedEpics(): Promise<{ created: number }> {
  for (let i = 0; i < mockEpics.length; i++) {
    const epic = mockEpics[i];
    const { id, ...data } = epic;
    const itemCount = epic.items.length;
    const storyPoints = epic.items.reduce((sum, item) => sum + (item.points ?? 0), 0);
    await setDoc(doc(EPICS_COL, id), { ...data, itemCount, storyPoints, order: i });
  }
  console.log(`📋 Seeded ${mockEpics.length} epics with ${mockEpics.reduce((s, e) => s + e.items.length, 0)} user stories`);
  return { created: mockEpics.length };
}
