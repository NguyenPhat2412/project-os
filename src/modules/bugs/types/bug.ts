import { Attachment } from '@/lib/types/attachment';

export type BugSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type BugStatus = 'open' | 'in-progress' | 'in-review' | 'fixed' | 'wont-fix';

export interface Bug {
  id: string;
  title: string;
  severity: BugSeverity;
  status: BugStatus;
  description?: string;
  stepsToReproduce?: string;
  assigneeId?: string; // ref → team_members/{id}
  reporterId?: string; // ref → team_members/{id} — who reported this bug
  order: number;
  startDate?: string; // DD/MM/YYYY — when investigation started
  deadline?: string; // DD/MM/YYYY — deadline to fix
  completedAt?: string; // DD/MM/YYYY — when bug was fully resolved/closed
  reportedAt?: string; // DD/MM/YYYY — ngày phát hiện (user input)
  resolvedAt?: string; // DD/MM/YYYY — set when status → Fixed
  sprintId?: string; // ref → Sprint document id (nullable, like tasks)
  attachments?: Attachment[];
}

export interface BugColumn {
  id: BugStatus;
  title: string;
  color: string;
  order: number;
}

export const BUG_COLUMNS: BugColumn[] = [
  { id: 'open', title: 'Open', color: '#ef4444', order: 0 },
  { id: 'in-progress', title: 'In Progress', color: '#8b5cf6', order: 1 },
  { id: 'in-review', title: 'In Review', color: '#f59e0b', order: 2 },
  { id: 'fixed', title: 'Fixed', color: '#22c55e', order: 3 },
  { id: 'wont-fix', title: "Won't Fix", color: '#64748b', order: 4 },
];
