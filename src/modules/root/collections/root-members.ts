import { createCollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { RootMember } from '../types/root-member';

/**
 * Root Members collection — top-level, not scoped to any project.
 * Used for root-level user management and RBAC.
 *
 * Path: `members/{uid}`
 */
export const rootMembersCollection = createCollection<RootMember>({
  path: 'v1/admin/users',
  transform: (raw): WithId<RootMember> => {
    const user = raw as unknown as { id: string; email: string; displayName?: string; avatarUrl?: string; role?: string; createdAt?: string; updatedAt?: string };
    return {
      id: user.id,
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.avatarUrl,
      roles: user.role === 'ROOT_ADMIN' ? ['Administrators'] : [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});
