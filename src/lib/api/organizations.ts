'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface Organization { id: string; name: string; slug: string; timezone: string; status: 'active' | 'disabled'; }
export interface Department { id: string; organizationId: string; parentId?: string | null; name: string; }
export interface Employee { id: string; organizationId: string; departmentId?: string | null; supervisorId?: string | null; userId?: string | null; fullName: string; email: string; title?: string | null; status: 'active' | 'inactive'; }
export interface OrganizationMember { id: string; organizationId: string; userId: string; role: string; status: string; }
export interface PermissionGroup { id: string; organizationId: string; name: string; description?: string | null; modules: string[]; memberIds: string[]; createdAt: string; updatedAt: string; }
export interface OrganizationAudit { id: string; actorId: string; eventType: string; entityType: string; entityId?: string | null; beforeState?: unknown; afterState?: unknown; reason?: string | null; createdAt: string; }

const key = (scope: string, organizationId?: string) => ['organizations', scope, organizationId] as const;

export function useOrganizations() {
  return useQuery({ queryKey: key('list'), queryFn: () => apiClient.get<Organization>('organizations'), staleTime: 30_000 });
}
export function useOrganizationMembers(organizationId: string | null) {
  return useQuery({ queryKey: key('members', organizationId ?? undefined), queryFn: () => apiClient.get<OrganizationMember>(`organizations/${organizationId}/members`), enabled: !!organizationId });
}
export function useDepartments(organizationId: string | null) {
  return useQuery({ queryKey: key('departments', organizationId ?? undefined), queryFn: () => apiClient.get<Department>(`organizations/${organizationId}/departments`), enabled: !!organizationId });
}
export function useEmployees(organizationId: string | null) {
  return useQuery({ queryKey: key('employees', organizationId ?? undefined), queryFn: () => apiClient.get<Employee>(`organizations/${organizationId}/employees`), enabled: !!organizationId });
}
export function usePermissionGroups(organizationId: string | null) {
  return useQuery({ queryKey: key('permission-groups', organizationId ?? undefined), queryFn: () => apiClient.get<PermissionGroup>(`organizations/${organizationId}/permission-groups`), enabled: !!organizationId });
}
export function useOrganizationAudit(organizationId: string | null) {
  return useQuery({ queryKey: key('audit', organizationId ?? undefined), queryFn: () => apiClient.get<OrganizationAudit>(`organizations/${organizationId}/audit`, { size: 20 }), enabled: !!organizationId });
}
export function useOrganizationMutations() {
  const queryClient = useQueryClient();
  const refresh = (organizationId?: string) => {
    void queryClient.invalidateQueries({ queryKey: key('list') });
    if (organizationId) void queryClient.invalidateQueries({ queryKey: ['organizations'], exact: false });
  };
  return {
    createOrganization: useMutation({ mutationFn: (body: { name: string; slug?: string; timezone?: string }) => apiClient.post<Organization>('organizations', body), onSuccess: () => refresh() }),
    createDepartment: useMutation({ mutationFn: ({ organizationId, name }: { organizationId: string; name: string }) => apiClient.post<Department>(`organizations/${organizationId}/departments`, { name }), onSuccess: (_, variables) => refresh(variables.organizationId) }),
    createEmployee: useMutation({ mutationFn: ({ organizationId, body }: { organizationId: string; body: { fullName: string; email: string; title?: string; departmentId?: string } }) => apiClient.post<Employee>(`organizations/${organizationId}/employees`, body), onSuccess: (_, variables) => refresh(variables.organizationId) }),
    upsertMember: useMutation({ mutationFn: ({ organizationId, userId, role }: { organizationId: string; userId: string; role: string }) => apiClient.put<OrganizationMember>(`organizations/${organizationId}/members`, { userId, role, status: 'active' }), onSuccess: (_, variables) => refresh(variables.organizationId) }),
  };
}

export function usePermissionGroupMutations() {
  const queryClient = useQueryClient();
  const refresh = (organizationId: string) => {
    void queryClient.invalidateQueries({ queryKey: key('permission-groups', organizationId) });
    void queryClient.invalidateQueries({ queryKey: key('audit', organizationId) });
    void queryClient.invalidateQueries({ queryKey: ['me', 'workspace'] });
  };
  return {
    createGroup: useMutation({
      mutationFn: ({ organizationId, body }: { organizationId: string; body: { name: string; description?: string; modules?: string[]; memberIds?: string[] } }) =>
        apiClient.post<PermissionGroup>(`organizations/${organizationId}/permission-groups`, body),
      onSuccess: (_, variables) => refresh(variables.organizationId),
    }),
    updateGroup: useMutation({
      mutationFn: ({ organizationId, groupId, body }: { organizationId: string; groupId: string; body: { name?: string; description?: string; modules?: string[]; memberIds?: string[] } }) =>
        apiClient.patch<PermissionGroup>(`organizations/${organizationId}/permission-groups/${groupId}`, body),
      onSuccess: (_, variables) => refresh(variables.organizationId),
    }),
    deleteGroup: useMutation({
      mutationFn: ({ organizationId, groupId }: { organizationId: string; groupId: string }) => apiClient.delete(`organizations/${organizationId}/permission-groups/${groupId}`),
      onSuccess: (_, variables) => refresh(variables.organizationId),
    }),
  };
}
