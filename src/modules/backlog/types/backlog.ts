/**
 * backlog.ts — Backlog module types
 * ──────────────────────────────────
 * Epic, UserStory, and related shared types.
 * Firestore collection lives in collections/epics.ts (avoids circular dep).
 */

export type EpicStatus = 'Planning' | 'In Progress' | 'Done' | 'On Hold';
export type UserStoryStatus = 'Todo' | 'In Progress' | 'Done' | 'Blocked';

export interface UserStoryItem {
  id: string;
  label: string;
  status: UserStoryStatus;
  priority: 'High' | 'Normal' | 'Low';
  points: number;
  startDate?: string;   // DD/MM/YYYY
  dueDate?: string;     // DD/MM/YYYY
  description?: string;
  goals?: string;
  assigneeId?: string;  // ref → team_members/{id}
}

export interface Epic {
  id: string;
  name: string;
  icon: string;
  priority: 'High' | 'Normal' | 'Low';
  status: EpicStatus;
  startDate?: string;   // DD/MM/YYYY
  dueDate?: string;     // DD/MM/YYYY
  description?: string;
  goals?: string;
  itemCount: number;
  storyPoints: number;
  items: UserStoryItem[];
}

/** Epic with Firestore document id attached */
export type EpicData = Epic & { id: string };

/** A single UserStory row inside an Epic */
export type EpicItem = EpicData['items'][number];
