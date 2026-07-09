import { projectsCollection } from '@/modules/projects/collections/projects';
import type { WithId } from '@/lib/firestore-rq';
import type { Project } from '@/modules/projects/types/project';

export function useProjects() {
  const query = projectsCollection.useList({
    orderBy: { field: 'createdAt', direction: 'asc' },
  });

  const fetchedProjects = (query.data ?? []) as WithId<Project>[];
  const projects = fetchedProjects;
  const activeProjects = projects.filter((p) => p.status === 'active');

  return { projects, activeProjects, isLoading: query.isLoading, error: query.error };
}
