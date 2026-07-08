export type SprintStatus = 'planned' | 'active' | 'completed';

export interface Sprint {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  goal: string;
  status: SprintStatus;
  order: number;
}
