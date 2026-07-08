/**
 * seed.ts — Projects module
 * ───────────────────────────
 * Seed the projects collection (top-level).
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { mockProjects } from '@/modules/projects/mock';

const PROJECTS_COL = collection(db, 'projects');

export async function seedProjects() {
  for (const project of mockProjects) {
    const { id, ...data } = project;
    await setDoc(doc(PROJECTS_COL, id), data);
  }
}
