import { createCollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { RootMember } from '../types/root-member';

/**
 * Root Members collection — top-level, not scoped to any project.
 * Used for root-level user management and RBAC.
 *
 * Path: `members/{uid}`
 */
export const rootMembersCollection = createCollection<RootMember>({
  path: 'members',
  transform: (raw): WithId<RootMember> => raw as unknown as WithId<RootMember>,
});
