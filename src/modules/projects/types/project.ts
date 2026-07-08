export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  icon: string;
  color: string; // gradient CSS or tailwind color token
  currentSprint?: string;
  quarter?: string;
  startDate?: string;
  endDate?: string;
  techStack?: string[];
  teamSize?: number;
  createdAt?: string;
}
