'use client';

import { useQuery } from '@tanstack/react-query';
import { getProject } from '@/modules/projects/api/projects-api';
import { projectKeys } from '@/modules/projects/hooks/useProjects';

export function useProjectDetail(projectId: string) {
  const query = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  });

  return {
    project: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
