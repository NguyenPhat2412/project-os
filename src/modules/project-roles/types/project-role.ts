/**
 * Project Role — represents a user's RBAC roles within a specific project.
 * Stored in `projects/{projectId}/project_roles/{memberId}`.
 */
export interface ProjectRole {
  /** Spring/PostgreSQL UID */
  uid: string;
  /** Document ID (matches uid) */
  memberId: string;
  /** Reference to root members/{memberId} */
  memberIdRef?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  /** Project-level RBAC roles assigned to this user */
  roles: string[];
  /** Project ID */
  projectId: string;
  joinedAt?: string;
  updatedAt?: string;
}
