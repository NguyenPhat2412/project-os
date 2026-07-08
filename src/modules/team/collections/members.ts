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
  path: 'members',
  transform: (raw): WithId<Member> => {
    const root = raw as unknown as WithId<RootMember>;
    const name = root.displayName ?? '';
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return {
      id: root.uid,
      name,
      displayName: name,
      email: root.email,
      initials,
      gradient: `linear-gradient(135deg,#6c63ff,#a855f7)`,
      photoURL: root.photoURL,
      roles: root.roles,
      status: 'Active',
    };
  },
});
