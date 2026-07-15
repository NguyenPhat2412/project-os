import { createCollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import type { RootMember } from '@/modules/root/types/root-member';
import type { Member } from '@/modules/team/types/team';

/**
 * Root-level `members` collection — backed by `/members/{uid}` in API.
 * Holds authoritative user profile data: displayName, email, initials, gradient, roles.
 *
 * Transform maps RootMember → Member fields.
 */
function directoryCollection(projectId?: string) {
  return createCollection<Member>({
  path: projectId ? `v1/users/directory?projectId=${projectId}` : 'v1/users/directory',
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
}

/** Directory scoped explicitly to the project rendered by a screen. */
export const projectDirectoryCollection = (projectId: string) => directoryCollection(projectId);

/** Backward-compatible directory for screens already scoped by the active project. */
export const membersCollection = directoryCollection();
