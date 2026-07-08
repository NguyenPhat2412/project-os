/**
 * seed.ts — Meetings module
 * ───────────────────────
 * Seed data and functions for meetings, notes, and action items.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { upcomingMeetings as mockMeetings } from '@/modules/meetings/mock';

const MEETINGS_COL = collection(db, `projects/${PROJECT_ID}/meetings`);

/**
 * Seed meetings — creates sample meetings with embedded notes if not exist.
 */
export async function seedMeetings(): Promise<{ created: number }> {
  const snap = await getDocs(MEETINGS_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockMeetings.length; i++) {
    const meeting = mockMeetings[i];
    const { id, ...data } = meeting;
    await setDoc(doc(MEETINGS_COL, id), { ...data, order: i });
  }
  console.log(`📅 Seeded ${mockMeetings.length} meetings (with embedded notes)`);
  return { created: mockMeetings.length };
}
