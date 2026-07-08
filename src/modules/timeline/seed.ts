/**
 * seed.ts — Timeline module
 * ───────────────────────
 * Seed data and functions for gantt phases and milestones.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { ganttPhases as mockGanttPhases, milestones as mockMilestones } from '@/modules/timeline/mock';

const PHASES_COL = collection(db, `projects/${PROJECT_ID}/gantt_phases`);
const MILESTONES_COL = collection(db, `projects/${PROJECT_ID}/milestones`);

/**
 * Seed gantt phases — creates sample phases if not exist
 */
export async function seedGanttPhases(): Promise<{ created: number }> {
  const snap = await getDocs(PHASES_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockGanttPhases.length; i++) {
    const phase = mockGanttPhases[i];
    const id = `GP-${String(i + 1).padStart(2, '0')}`;
    await setDoc(doc(PHASES_COL, id), phase);
  }
  console.log(`📊 Seeded ${mockGanttPhases.length} gantt phases`);
  return { created: mockGanttPhases.length };
}

/**
 * Seed milestones — creates sample milestones if not exist
 */
export async function seedMilestones(): Promise<{ created: number }> {
  const snap = await getDocs(MILESTONES_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockMilestones.length; i++) {
    const milestone = mockMilestones[i];
    const { id, ...data } = milestone;
    await setDoc(doc(MILESTONES_COL, id), { ...data, order: i });
  }
  console.log(`🏁 Seeded ${mockMilestones.length} milestones`);
  return { created: mockMilestones.length };
}
