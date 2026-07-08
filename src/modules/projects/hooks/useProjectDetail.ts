import { projectsCollection } from '../collections/projects';
import type { WithId } from '@/lib/firestore-rq';
import type { Project } from '../types/project';

export function useProjectDetail(projectId: string) {
  const query = projectsCollection.useDocument(projectId);
  const project = query.data as WithId<Project> | undefined;

  return {
    project,
    isLoading: query.isLoading,
    error: query.error,
  };
}
