/**
 * seed.ts — Tasks module
 * ───────────────────────
 * Seed data and functions for tasks and task columns.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { tasks as mockTasks, mockTaskColumns } from '@/modules/tasks/mock';

const TASKS_COL = collection(db, `projects/${PROJECT_ID}/tasks`);
const TASK_COLUMNS_COL = collection(db, `projects/${PROJECT_ID}/task_columns`);

/**
 * Seed task columns — always overwrites to keep data in sync.
 */
export async function seedTaskColumns(): Promise<{ created: number }> {
  for (const column of mockTaskColumns) {
    await setDoc(doc(TASK_COLUMNS_COL, column.id), column);
  }
  console.log(`🧱 Seeded ${mockTaskColumns.length} task columns`);
  return { created: mockTaskColumns.length };
}

/**
 * Ensure task columns exist — always overwrites.
 */
export async function ensureTaskColumnsCollection(): Promise<void> {
  for (const column of mockTaskColumns) {
    await setDoc(doc(TASK_COLUMNS_COL, column.id), column);
  }
  console.log(`🧱 Task columns created: ${mockTaskColumns.length}`);
}

/**
 * Seed tasks — always overwrites to keep data in sync.
 */
export async function seedTasks(): Promise<{ created: number }> {
  for (const task of mockTasks) {
    const { id, ...data } = task;
    await setDoc(doc(TASKS_COL, id), data);
  }
  console.log(`✅ Seeded ${mockTasks.length} tasks`);
  return { created: mockTasks.length };
}
