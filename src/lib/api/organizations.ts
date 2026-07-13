'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface Organization { id: string; name: string; slug: string; timezone: string; status: 'active' | 'disabled'; }
export interface Department { id: string; organizationId: string; parentId?: string | null; name: string; }
export interface Employee { id: string; organizationId: string; departmentId?: string | null; supervisorId?: string | null; userId?: string | null; fullName: string; email: string; title?: string | null; status: 'active' | 'inactive'; }

const key = (scope: string, organizationId?: string) => ['organizations', scope, organizationId] as const;

export function useOrganizations() {
  return useQuery({ queryKey: key('list'), queryFn: () => apiClient.get<Organization>('organizations'), staleTime: 30_000 });
}
export function useOrganizationMembers(organizationId: string | null) {
  return useQuery({ queryKey: key('members', organizationId ?? undefined), queryFn: () => apiClient.get(`organizations/${organizationId}/members`), enabled: !!organizationId });
}
export function useDepartments(organizationId: string | null) {
  return useQuery({ queryKey: key('departments', organizationId ?? undefined), queryFn: () => apiClient.get<Department>(`organizations/${organizationId}/departments`), enabled: !!organizationId });
}
export function useEmployees(organizationId: string | null) {
  return useQuery({ queryKey: key('employees', organizationId ?? undefined), queryFn: () => apiClient.get<Employee>(`organizations/${organizationId}/employees`), enabled: !!organizationId });
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
  };
}
