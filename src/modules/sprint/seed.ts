/**
 * seed.ts — Sprint module
 * ────────────────────────
 * Seed sprint collection into Firestore.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { sprints as mockSprints } from '@/modules/sprint/mock';

const SPRINTS_COL = collection(db, `projects/${PROJECT_ID}/sprints`);

/**
 * Seed sprints — always overwrites to keep data in sync.
 */
export async function seedSprints(): Promise<{ created: number }> {
  for (const sprint of mockSprints) {
    const { id, ...data } = sprint;
    await setDoc(doc(SPRINTS_COL, id), data);
  }
  console.log(`🏃 Seeded ${mockSprints.length} sprints`);
  return { created: mockSprints.length };
}
