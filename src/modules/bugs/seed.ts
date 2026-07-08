/**
 * seed.ts — Bugs module
 * ───────────────────────
 * Seed data and functions for bugs and bug columns.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { bugs as mockBugs, mockBugColumns } from '@/modules/bugs/mock';

const BUGS_COL = collection(db, `projects/${PROJECT_ID}/bugs`);
const BUG_COLUMNS_COL = collection(db, `projects/${PROJECT_ID}/bug_columns`);

/**
 * Seed bug columns — always overwrites to keep data in sync.
 */
export async function seedBugColumns(): Promise<{ created: number }> {
  for (const col of mockBugColumns) {
    await setDoc(doc(BUG_COLUMNS_COL, col.id), col);
  }
  console.log(`🐛 Seeded ${mockBugColumns.length} bug columns`);
  return { created: mockBugColumns.length };
}

/**
 * Seed bugs — always overwrites to keep data in sync.
 */
export async function seedBugs(): Promise<{ created: number }> {
  for (const bug of mockBugs) {
    const { id, ...data } = bug;
    await setDoc(doc(BUGS_COL, id), data);
  }
  console.log(`🐛 Seeded ${mockBugs.length} bugs`);
  return { created: mockBugs.length };
}
