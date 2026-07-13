'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useProject } from '@/store/project-store';
import type { TeamMember } from '@/modules/team/types/team';

export interface ReportReadModel<T> {
  items: T[];
  members: TeamMember[];
  summary: {
    total: number;
    status: Record<string, number>;
    priority: Record<string, number>;
    level: Record<string, number>;
  };
}

export interface WorkloadReadModel {
  members: TeamMember[];
  workload: { assigneeId: string; tasks: number; points: number; status: Record<string, number> }[];
}

export interface DashboardReadModel {
  meetings: unknown[];
  tasks: { status?: string }[];
  bugs: { status?: string }[];
  risks: unknown[];
  team: TeamMember[];
  summary: { tasks: number; bugs: number; risks: number; members: number };
}

export function useDashboardReadModel() {
  const { projectId } = useProject();
  return useQuery({
    queryKey: ['read-model', 'dashboard', projectId],
    queryFn: () => apiClient.getOne<DashboardReadModel>(`projects/${projectId}/read-model/dashboard`),
    enabled: !!projectId,
  });
}

export function useReportReadModel<T>(resource: 'tasks' | 'bugs' | 'risks') {
  const { projectId } = useProject();
  return useQuery({
    queryKey: ['read-model', 'report', resource, projectId],
    queryFn: () => apiClient.getOne<ReportReadModel<T>>(`projects/${projectId}/read-model/reports/${resource}`),
    enabled: !!projectId,
  });
}

export function useWorkloadReadModel() {
  const { projectId } = useProject();
  return useQuery({
    queryKey: ['read-model', 'workload', projectId],
    queryFn: () => apiClient.getOne<WorkloadReadModel>(`projects/${projectId}/read-model/workload`),
    enabled: !!projectId,
  });
}
