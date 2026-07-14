import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export type WorkspaceRole = 'PLATFORM_ADMIN' | 'HR' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE';

export interface Workspace {
  organization: { id: string; name: string; timezone: string };
  employee: { id: string; userId: string; fullName: string; supervisorId?: string | null } | null;
  systemRole: WorkspaceRole;
  modules: string[];
  scopes: Record<string, 'SELF' | 'DEPARTMENT' | 'ASSIGNED_PROJECT' | 'ORGANIZATION'>;
}

export function useWorkspace() {
  return useQuery({
    queryKey: ['me', 'workspace'],
    queryFn: () => apiClient.getOne<Workspace>('v1/me/workspace'),
    staleTime: 30_000,
    retry: false,
  });
}
