import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { ProjectRole } from '../types/project-role';

/**
 * Project Roles subcollection — scoped to a specific project.
 *
 * Path: `projects/{projectId}/project_roles/{memberId}`
 *
 * Usage:
 * ```ts
 * const projectRolesForDefault = projectRolesCollection('default');
 * const { data: roles } = projectRolesForDefault.useList();
 * ```
 */
export const projectRolesCollection = createSubcollection<ProjectRole>({
  path: (projectId: string) => `projects/${projectId}/project_roles`,
  transform: (raw): WithId<ProjectRole> => raw as unknown as WithId<ProjectRole>,
});
