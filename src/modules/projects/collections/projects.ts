import { createCollection } from '@/lib/api-rq';
import type { Project } from '@/modules/projects/types/project';

/**
 * Top-level `projects` collection — not a subcollection.
 * Each document IS the project root (subcollections live under it).
 */
export const projectsCollection = createCollection<Project>({
  path: 'projects',
});
