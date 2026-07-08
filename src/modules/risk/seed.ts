/**
 * seed.ts — Risk module
 * ───────────────────────
 * Seed data and functions for risks.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { risks as mockRisks } from '@/modules/risk/mock';

const RISKS_COL = collection(db, `projects/${PROJECT_ID}/risks`);

/**
 * Seed risks — always overwrites to keep data in sync.
 */
export async function seedRisks(): Promise<{ created: number }> {
  for (let i = 0; i < mockRisks.length; i++) {
    const risk = mockRisks[i];
    const { id, ...data } = risk;
    await setDoc(doc(RISKS_COL, id), { ...data, order: i });
  }
  console.log(`⚠️ Seeded ${mockRisks.length} risks`);
  return { created: mockRisks.length };
}
