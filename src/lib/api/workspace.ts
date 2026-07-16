'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export type WorkspaceRole = 'PLATFORM_ADMIN' | 'HR' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE';

export interface Workspace {
  organization: { id: string; name: string; timezone: string };
  employee: { id: string; userId: string; fullName: string; title?: string | null; supervisorId?: string | null } | null;
  systemRole: WorkspaceRole;
  departmentName?: string | null;
  permissionGroups?: string[];
  modules: string[];
  scopes: Record<string, 'SELF' | 'DEPARTMENT' | 'ASSIGNED_PROJECT' | 'ORGANIZATION'>;
}

const ORGANIZATION_STORAGE_KEY = 'activeOrganizationId';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function storedOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(ORGANIZATION_STORAGE_KEY);
  return value && UUID_PATTERN.test(value) ? value : null;
}

export function rememberOrganization(id: string) {
  if (typeof window !== 'undefined' && UUID_PATTERN.test(id)) {
    localStorage.setItem(ORGANIZATION_STORAGE_KEY, id);
  }
}

export function useWorkspace() {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('organizationId');
  const organizationId = fromUrl && UUID_PATTERN.test(fromUrl) ? fromUrl : storedOrganizationId();
  return useQuery({
    queryKey: ['me', 'workspace', organizationId],
    queryFn: () => apiClient.getOne<Workspace>(organizationId
      ? `v1/me/workspace?organizationId=${encodeURIComponent(organizationId)}`
      : 'v1/me/workspace'),
    staleTime: 30_000,
    refetchOnWindowFocus: 'always',
    retry: false,
  });
}
