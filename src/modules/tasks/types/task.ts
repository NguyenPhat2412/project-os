export type Priority = 'High' | 'Normal' | 'Low';
export type TaskStatus = string;

export interface TaskColumn {
  id: string;
  title: string;
  color: string;
  order: number;
  progress: number;
  isDone?: boolean;
}

export interface Task {
  id: string; // Display key: "TASK-01", "TASK-02", ...
  uuid?: string; // Stable PostgreSQL identity used by links and API requests
  legacyId?: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  description?: string;
  assigneeId?: string; // ref → team_members/{id}
  reporterId?: string; // ref → team_members/{id} — who requested this task
  deadline?: string; // "DD/MM/YYYY"
  startDate?: string; // "DD/MM/YYYY" — when work started
  completedAt?: string; // "DD/MM/YYYY" — set when status → done
  points?: number;
  sprintId?: string; // links to Sprint document id
  attachments?: import('@/lib/types/attachment').Attachment[];

  order: number;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
