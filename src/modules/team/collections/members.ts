import { createCollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { RootMember } from '@/modules/root/types/root-member';
import type { Member } from '@/modules/team/types/team';

/**
 * Root-level `members` collection — backed by `/members/{uid}` in Firestore.
 * Holds authoritative user profile data: displayName, email, initials, gradient, roles.
 *
 * Transform maps RootMember → Member fields.
 */
export const membersCollection = createCollection<Member>({
  path: 'v1/users/directory',
  transform: (raw): WithId<Member> => {
    const root = raw as unknown as WithId<RootMember> & { id: string; role?: string; status?: string; avatarUrl?: string };
    const name = root.displayName ?? root.email ?? '';
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return {
      id: root.id ?? root.uid,
      name,
      displayName: name,
      email: root.email,
      initials,
      gradient: `linear-gradient(135deg,#6c63ff,#a855f7)`,
      photoURL: root.avatarUrl ?? root.photoURL,
      roles: root.role ? [root.role] : (root.roles ?? []),
      status: root.status === 'DISABLED' ? 'Vacant' : 'Active',
    };
  },
});
