import { createSubcollection } from '@/lib/firestore-rq';
import type { WithId } from '@/lib/firestore-rq';
import type { ProjectTeamMember } from '@/modules/team/types/team';
import { ACTIVE_PROJECT_ID } from '@/lib/project';

/**
 * Project-scoped members subcollection factory.
 * Path: projects/{projectId}/members/{memberId}
 *
 * Each doc stores denormalized fields (name, email, initials, gradient, role).
 * The doc id = memberId (references root members/{id}).
 */
export const projectMembersCollection = createSubcollection<ProjectTeamMember>({
  path: (projectId: string) => `projects/${projectId}/members`,
  transform: (raw): WithId<ProjectTeamMember> => {
    const data = raw as unknown as ProjectTeamMember;
    return { id: data.memberId, ...data } as WithId<ProjectTeamMember>;
  },
});

/** Singleton for the active project — used by the Team module. */
export const teamCollection = projectMembersCollection(ACTIVE_PROJECT_ID);
