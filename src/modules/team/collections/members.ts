import { createCollection } from '@/lib/api-rq';
import type { WithId } from '@/lib/api-rq';
import { apiClient, type PageMeta } from '@/lib/api/client';
import type { RootMember } from '@/modules/root/types/root-member';
import type { Member } from '@/modules/team/types/team';

/**
 * Root-level `members` collection — backed by `/members/{uid}` in API.
 * Holds authoritative user profile data: displayName, email, initials, gradient, roles.
 *
 * Transform maps RootMember → Member fields.
 */
const DIRECTORY_PAGE_SIZE = 10;

type DirectoryEntry = WithId<RootMember> & {
  id: string;
  role?: string;
  status?: string;
  avatarUrl?: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toMember(raw: unknown): WithId<Member> {
  const root = raw as DirectoryEntry;
  const displayName = root.displayName?.trim();
  const name = displayName && !isUuid(displayName)
    ? displayName
    : root.email?.trim() || 'Chưa cập nhật tên';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return {
    id: root.id ?? root.uid,
    name,
    displayName: name,
    email: root.email ?? '',
    initials,
    gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)',
    photoURL: root.avatarUrl ?? root.photoURL,
    roles: root.role ? [root.role] : (root.roles ?? []),
    status: root.status === 'DISABLED' ? 'Vacant' : 'Active',
  };
}

function directoryCollection(projectId?: string) {
  return createCollection<Member>({
    path: projectId ? `v1/users/directory?projectId=${projectId}` : 'v1/users/directory',
    transform: toMember,
  });
}

/** Directory scoped explicitly to the project rendered by a screen. */
export const projectDirectoryCollection = (projectId: string) => directoryCollection(projectId);

export interface DirectoryPage {
  data: Member[];
  meta: PageMeta;
}

/** Root-admin directory, always loaded from the database in pages of ten. */
export async function getRootDirectoryPage(page: number, search: string): Promise<DirectoryPage> {
  const result = await apiClient.getPage<DirectoryEntry>('v1/users/directory?_directoryScope=global', {
    page,
    size: DIRECTORY_PAGE_SIZE,
    search: search.trim() || undefined,
  });
  return { data: result.data.map(toMember), meta: result.meta };
}

/** Backward-compatible directory for screens already scoped by the active project. */
export const membersCollection = directoryCollection();
