import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { RoleDefinition } from '../types/role-definition';

/**
 * Role Definitions subcollection — scoped to a specific project.
 *
 * Path: `projects/{projectId}/role_definitions/{slugifiedId}`
 * Document ID = slugify(name)
 *
 * Usage:
 * ```ts
 * const roleDefs = roleDefinitionsCollection('default');
 * const { data: defs } = roleDefs.useList();
 * ```
 */
export const roleDefinitionsCollection = createSubcollection<RoleDefinition>({
  path: (projectId: string) => `projects/${projectId}/roles`,
  transform: (raw): WithId<RoleDefinition> => ({
    ...(raw as unknown as RoleDefinition),
    // Document ID từ Firestore snapshot → gán vào field `id`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: (raw as any).id ?? raw.name?.toLowerCase().replace(/\s+/g, '-') ?? '',
  }),
});
