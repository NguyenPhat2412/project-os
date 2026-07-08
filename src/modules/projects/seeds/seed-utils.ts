/**
 * seed-utils.ts — Per-project collection factory
 * ───────────────────────────────────────────────
 * Uses Firebase Client SDK directly (firestore.ts) for seeding.
 */

import {
  collection, getDocs, deleteDoc, doc, setDoc,
  getDoc, orderBy, getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Bug, BugColumn } from '@/modules/bugs/types/bug';
import type { Risk } from '@/modules/risk/types/risk';
import type { Epic } from '@/modules/backlog/types/backlog';
import { DEFAULT_TASK_COLUMNS } from '@/modules/tasks/utils/taskColumns';
import { BUG_COLUMNS } from '@/modules/bugs/types/bug';

export function createProjectCollections(projectId: string) {
  const p = (sub: string) => `projects/${projectId}/${sub}`;
  return {
    tasks: { ref: (id: string) => doc(db, p('tasks'), id), col: collection(db, p('tasks')) },
    taskColumns: { ref: (id: string) => doc(db, p('task_columns'), id), col: collection(db, p('task_columns')) },
    team: { ref: (id: string) => doc(db, p('members'), id), col: collection(db, p('members')) },
    sprints: { ref: (id: string) => doc(db, p('sprints'), id), col: collection(db, p('sprints')) },
    bugs: { ref: (id: string) => doc(db, p('bugs'), id), col: collection(db, p('bugs')) },
    bugColumns: { ref: (id: string) => doc(db, p('bug_columns'), id), col: collection(db, p('bug_columns')) },
    risks: { ref: (id: string) => doc(db, p('risks'), id), col: collection(db, p('risks')) },
    epics: { ref: (id: string) => doc(db, p('epics'), id), col: collection(db, p('epics')) },
  };
}

export type ProjectCollections = ReturnType<typeof createProjectCollections>;

export async function seedTaskColumnsForProject(projectId: string) {
  const { taskColumns } = createProjectCollections(projectId);
  for (const col of DEFAULT_TASK_COLUMNS) {
    await setDoc(taskColumns.ref(col.id), col);
  }
}

export async function seedBugColumnsForProject(projectId: string) {
  const { bugColumns } = createProjectCollections(projectId);
  for (const col of BUG_COLUMNS) {
    await setDoc(bugColumns.ref(col.id), col);
  }
}

// Subcollections seeded for HRM / Mobile Banking projects
export const BASIC_SUBCOLLECTIONS = [
  'tasks', 'task_columns', 'members', 'sprints', 'bugs', 'bug_columns', 'risks', 'epics',
] as const;

// All subcollections for the default (E-Commerce) project
export const FULL_SUBCOLLECTIONS = [
  'tasks', 'task_columns', 'members', 'sprints', 'bugs', 'bug_columns', 'risks', 'epics',
  'budget_items', 'expenses', 'documents', 'wiki_links', 'meetings',
  'activity_feed', 'notifications', 'gantt_phases', 'milestones',
  'action_items', 'doc_activity', 'activity_comments',
] as const;

/**
 * Delete the project document at projects/{projectId}.
 * Returns true if the document existed and was deleted.
 */
export async function deleteProjectDoc(projectId: string): Promise<boolean> {
  const docRef = doc(db, 'projects', projectId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await deleteDoc(docRef);
    return true;
  }
  return false;
}

/**
 * Delete the projects/{projectId} document and all documents in each listed subcollection.
 * Returns total number of subcollection documents deleted (excludes the project doc itself).
 */
export async function clearProjectData(
  projectId: string,
  subcollections: readonly string[],
): Promise<number> {
  await deleteProjectDoc(projectId);

  let total = 0;
  for (const sub of subcollections) {
    const colRef = collection(db, `projects/${projectId}/${sub}`);
    const snap = await getDocs(colRef);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    total += snap.size;
  }
  return total;
}
