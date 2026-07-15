'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, deleteProject, listProjects, updateProject, type ProjectWrite } from '@/modules/projects/api/projects-api';
import { useWorkspace } from '@/lib/api/workspace';

export const projectKeys = {
  all: ['platform', 'projects'] as const,
  list: (organizationId: string | undefined) => ['platform', 'projects', 'list', organizationId] as const,
  detail: (id: string) => ['platform', 'projects', id] as const,
};

export function useProjects() {
  const workspace = useWorkspace();
  const organizationId = workspace.data?.organization.id;
  const query = useQuery({
    queryKey: projectKeys.list(organizationId),
    queryFn: () => listProjects(organizationId!),
    enabled: Boolean(organizationId),
  });
  const projects = query.data?.data ?? [];

  return {
    projects,
    activeProjects: projects.filter((project) => project.status === 'active'),
    isLoading: workspace.isLoading || query.isLoading,
    error: workspace.error ?? query.error,
  };
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: projectKeys.all });

  const create = useMutation({
    mutationFn: (data: ProjectWrite) => createProject(data),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectWrite> }) => updateProject(id, data),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      return refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: refresh,
  });

  return { create, update, remove };
}
