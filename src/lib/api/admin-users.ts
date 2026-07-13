'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { TeamMember } from '@/modules/team/types/team';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: 'ROOT_ADMIN' | 'USER';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUser {
  email: string;
  password: string;
  displayName: string;
  role: AdminUser['role'];
}

export type UpdateAdminUser = Partial<CreateAdminUser> & {
  avatarUrl?: string | null;
  status?: AdminUser['status'];
};

const key = ['identity', 'admin-users'] as const;

export function toTeamMember(user: AdminUser): TeamMember {
  const initials = user.displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return {
    id: user.id,
    name: user.displayName,
    displayName: user.displayName,
    email: user.email,
    initials: initials || user.email.slice(0, 2).toUpperCase(),
    gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)',
    photoURL: user.avatarUrl ?? undefined,
    roles: [user.role],
    status: user.status === 'ACTIVE' ? 'Active' : 'Vacant',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function useAdminUsers() {
  return useQuery({ queryKey: key, queryFn: () => apiClient.get<AdminUser>('v1/admin/users', { size: 100 }) });
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: [...key, id],
    queryFn: () => apiClient.getOne<AdminUser>(`v1/admin/users/${id}`),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAdminUser) => (await apiClient.post<AdminUser>('v1/admin/users', data)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUser }) =>
      apiClient.patch<AdminUser>(`v1/admin/users/${id}`, data),
    onSuccess: (_, { id }) => {
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: [...key, id] });
    },
  });
}

export function useDisableAdminUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`v1/admin/users/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
