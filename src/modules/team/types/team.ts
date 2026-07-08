// ─── Root: Global member profile (stored in `members/{uid}`) ───────────────

export type WorkloadStatus = 'Active' | 'Overloaded' | 'Busy' | 'Vacant';

/**
 * Member — authoritative user profile stored in root `/members/{uid}`.
 * Holds display fields and root-level roles.
 */
export interface Member {
  id: string;
  /** Display name — same as displayName, kept for backward compatibility */
  name: string;
  displayName?: string;
  email: string;
  initials: string;
  gradient: string;
  /** Optional photo URL — when present, UserAvatar renders the photo; otherwise falls back to initials */
  photoURL?: string;
  roles: string[];
  status: WorkloadStatus;
  /** Optional — populated when joined with task/bug data */
  taskCount?: number;
  /** Optional — populated when joined with task/bug data */
  workload?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Alias for backward compatibility */
export type TeamMember = Member;

/** Derive workload status from percentage (0-100). */
export function getStatusFromWorkload(workload: number): WorkloadStatus {
  if (workload >= 90) return 'Overloaded';
  if (workload >= 75) return 'Busy';
  if (workload >= 20) return 'Active';
  return 'Vacant';
}

// ─── Subcollection: Project team membership (stored in `projects/{pid}/members/{id}`) ───

/**
 * ProjectTeamMember — project-scoped membership document.
 * Doc id = memberId (references /members/{memberId}).
 * Stores only project-specific data: roles and notes.
 * Display fields come from the JOIN with root /members.
 */
export interface ProjectTeamMember {
  /** String ID matching doc id in /members/{memberId} */
  memberId: string;
  /** Project-level roles assigned to this member (overrides root roles in UI) */
  roles: string[];
  /** Optional notes about this member in this project */
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Joined: UI display type (result of JOIN root + subcollection) ───────────

/**
 * TeamMemberWithRole — joined result for UI.
 * Combines Member display fields with ProjectTeamMember roles.
 * Computed fields (taskCount, workload) are added by useTeam hook.
 */
export interface TeamMemberWithRole extends Member {
  /** Project-level roles (from subcollection, overrides Member.roles) */
  roles: string[];
  taskCount?: number;
  workload?: number;
}
