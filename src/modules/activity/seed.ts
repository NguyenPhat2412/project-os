/**
 * seed.ts — Activity module
 * ───────────────────────
 * Seed data and functions for activity feed and notifications.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { activityFeed as mockActivityFeed, notifications as mockNotifications } from '@/modules/activity/mock';

const ACTIVITY_COL = collection(db, `projects/${PROJECT_ID}/activity_feed`);
const NOTIFICATIONS_COL = collection(db, `projects/${PROJECT_ID}/notifications`);

/**
 * Seed activity feed — creates sample activities if not exist
 */
export async function seedActivityFeed(): Promise<{ created: number }> {
  const snap = await getDocs(ACTIVITY_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockActivityFeed.length; i++) {
    const activity = mockActivityFeed[i];
    const { id, ...data } = activity;
    await setDoc(doc(ACTIVITY_COL, id), { ...data, order: i });
  }
  console.log(`📡 Seeded ${mockActivityFeed.length} activity entries`);
  return { created: mockActivityFeed.length };
}

/**
 * Seed notifications — creates sample notifications if not exist
 */
export async function seedNotifications(): Promise<{ created: number }> {
  const snap = await getDocs(NOTIFICATIONS_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockNotifications.length; i++) {
    const notification = mockNotifications[i];
    const { id, ...data } = notification;
    await setDoc(doc(NOTIFICATIONS_COL, id), { ...data, order: i });
  }
  console.log(`🔔 Seeded ${mockNotifications.length} notifications`);
  return { created: mockNotifications.length };
}
