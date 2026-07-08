/**
 * Root Member — represents a user at root level (not scoped to any project).
 * Stored in `members/{uid}`.
 */
export interface RootMember {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  /** Root-level roles assigned to this user */
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}
