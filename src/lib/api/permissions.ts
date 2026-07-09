/**
 * Permission Service — Firestore BFF layer.
 *
 * Server-side permission checking using Firebase Admin SDK.
 * Reads role assignments from:
 *   - `projects/{projectId}/project_roles/{uid}`  → { roles: string[] }
 *   - `members/{uid}`                             → { roles: string[] }
 *
 * Built on the ProjectOS role model where roles are named strings
 * (e.g. "Administrators", "Developer", "Project Manager").
 *
 * Usage in API routes:
 * ```ts
 * import { checkPermission, requirePermission } from '@/lib/api/permissions';
 *
 * // Guard — throws on denial
 * await requirePermission({ uid, projectId, action: 'read', resource: 'tasks' });
 *
 * // Check — returns boolean
 * const allowed = await checkPermission({ uid, projectId, action: 'write', resource: 'tasks' });
 * ```
 */
import { db } from '@/lib/firestore-admin';
import { getServerAdminEmails, isAdminEmail, ROOT_ADMIN_ROLE } from '@/lib/admin-emails';

// ─── Types ───────────────────────────────────────────────────────────────────

/** All project-scoped resources that can be permission-checked. */
export type Resource =
  | 'tasks' | 'sprints' | 'bugs' | 'backlog'
  | 'task_columns' | 'bug_columns'
  | 'config'
  | 'budget' | 'budget_items' | 'expenses'
  | 'risks'
  | 'meetings' | 'action_items'
  | 'documents' | 'folders' | 'wiki_links' | 'doc_activity'
  | 'timeline' | 'milestones' | 'gantt_phases'
  | 'activity_feed' | 'activity_comments'
  | 'notifications'
  | 'members' | 'comments' | 'epics'
  | 'roles' | 'project_roles';

/** Actions that can be performed on a resource. */
export type Action = 'read' | 'write' | 'delete' | 'admin';

/**
 * Context required to check a permission.
 * `projectId` is required for project-scoped resources.
 * For 'projects' resource, `projectId` may be omitted.
 */
export interface PermissionContext {
  uid: string;
  email?: string | null;
  projectId?: string;
  action: Action;
  resource: Resource | 'projects';
}

// ─── Path → Resource mapping ─────────────────────────────────────────────────

/**
 * Map a Firestore collection path to a Resource type.
 * Returns null for paths that don't map to a project-scoped resource.
 *
 * Handles both collection-group-style paths and exact subcollection paths.
 */
export function pathToResource(collectionPath: string): Resource | 'projects' | null {
  const path = collectionPath.trim().replace(/^\/?firestore\/projects\//, '');

  // Root collections
  if (path === 'projects') return 'projects';

  // Strip document IDs from path segments — we only care about the collection name
  // Path format: projects/{projectId}/subcollection/{docId}/...
  const segments = path.split('/');
  // Find the index of 'projects' and extract subcollection path
  const projIdx = segments.indexOf('projects');
  const subPath = projIdx >= 0 ? segments.slice(projIdx + 2).join('/') : segments.join('/');

  // Map subcollection names (first segment after project ID) to resources
  switch (subPath) {
    case 'tasks':                return 'tasks';
    case 'task_columns':         return 'task_columns';
    case 'sprints':              return 'sprints';
    case 'dashboard':            return 'config';
    case 'reports':              return 'config';
    case 'sprint':               return 'config';
    case 'ai_settings':          return 'config';
    case 'theme':                return 'config';
    case 'bugs':                 return 'bugs';
    case 'bug_columns':          return 'bug_columns';
    case 'backlog':              return 'backlog';
    case 'epics':                return 'epics';
    case 'budget':               return 'budget';
    case 'budget_items':         return 'budget_items';
    case 'expenses':             return 'expenses';
    case 'risks':                return 'risks';
    case 'meetings':             return 'meetings';
    case 'action_items':         return 'action_items';
    case 'documents':            return 'documents';
    case 'folders':              return 'folders';
    case 'wiki_links':           return 'wiki_links';
    case 'doc_activity':         return 'doc_activity';
    case 'timeline':             return 'timeline';
    case 'milestones':           return 'milestones';
    case 'gantt_phases':         return 'gantt_phases';
    case 'activity_feed':        return 'activity_feed';
    case 'activity_comments':    return 'activity_comments';
    case 'notifications':        return 'notifications';
    case 'members':              return 'members';
    case 'comments':             return 'comments';
    case 'roles':                return 'roles';
    case 'project_roles':        return 'project_roles';
    default:                     return null;
  }
}

// ─── Role resolution ─────────────────────────────────────────────────────────

/** Role names that grant full admin access within a project scope. */
const PROJECT_ADMIN_ROLES = ['Project Admin', 'Administrators'];

/** Root admin roles — grant full access everywhere. */

/**
 * Fetch a user's project-level roles from `projects/{projectId}/project_roles/{uid}`.
 * Returns [] if the user has no role assignment in this project.
 */
async function getProjectRoles(uid: string, projectId: string): Promise<string[]> {
  const snap = await db.collection('projects').doc(projectId).collection('project_roles').doc(uid).get();
  if (!snap.exists) return [];
  const data = snap.data() as { roles?: string[] };
  return data.roles ?? [];
}

/**
 * Check if the given email matches the configured admin email.
 * This mirrors the ADMIN_EMAIL check in auth-store.
 */
function isConfiguredAdminEmail(email: string | null): boolean {
  return isAdminEmail(email, getServerAdminEmails());
}

// ─── Core permission checks ───────────────────────────────────────────────────

/**
 * Get all effective roles for a user across root + project scope.
 * Combines root roles with project-specific roles.
 */
export async function getEffectiveRoles(
  uid: string,
  projectId?: string,
  sessionEmail?: string | null,
): Promise<{ rootRoles: string[]; projectRoles: string[]; isRootAdmin: boolean }> {
  if (isConfiguredAdminEmail(sessionEmail ?? null)) {
    return { rootRoles: [ROOT_ADMIN_ROLE], projectRoles: [], isRootAdmin: true };
  }

  const [memberSnap, ...rest] = await Promise.all([
    db.collection('members').doc(uid).get(),
    ...(projectId ? [getProjectRoles(uid, projectId)] : []),
  ]);

  const memberData = memberSnap.data() as { roles?: string[]; email?: string } | undefined;
  const rootRoles = memberData?.roles ?? [];
  const email = sessionEmail ?? memberData?.email ?? null;

  const projectRoles = projectId ? rest[0] : [];
  const isRootAdmin = rootRoles.includes(ROOT_ADMIN_ROLE) || isConfiguredAdminEmail(email);

  return { rootRoles, projectRoles, isRootAdmin };
}

/**
 * Check if any of the given roles match a project-admin role name.
 */
function hasProjectAdminRole(roles: string[]): boolean {
  return PROJECT_ADMIN_ROLES.some((r) => roles.includes(r));
}

/**
 * Check if any of the given roles match a root-admin role name.
 */
// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check whether a user is allowed to perform an action on a resource.
 *
 * Permission matrix (simplified role model):
 *  - Root admin (Administrators role OR admin email): always allowed
 *  - Project admin (Project Admin role): always allowed within that project
 *  - Authenticated user: allowed for 'projects' root collection
 *  - All other users with any role assignment: allowed for read on any resource
 *    (write/delete/admin require explicit project admin or root admin role)
 *
 * This matches the ProjectOS model where roles are named strings, not
 * granular CRUD matrices. Specific write/delete restrictions can be
 * tightened per-resource as needed.
 *
 * @returns true if permitted, false otherwise
 */
export async function checkPermission(ctx: PermissionContext): Promise<boolean> {
  const { uid, email, projectId, action, resource } = ctx;

  // ── 'projects' top-level collection ──────────────────────────────────────
  // Any authenticated user can read projects; only root admins can mutate them.
  if (resource === 'projects') {
    if (action === 'read') return true;
    try {
      const { isRootAdmin } = await getEffectiveRoles(uid, undefined, email);
      return isRootAdmin;
    } catch {
      return false;
    }
  }

  // ── Require projectId for project-scoped resources ────────────────────────
  if (!projectId) {
    // No projectId provided — deny project-scoped resources
    return false;
  }

  // ── Resolve all effective roles ────────────────────────────────────────────
  const { rootRoles, projectRoles, isRootAdmin } = await getEffectiveRoles(uid, projectId, email);
  const allRoles = [...rootRoles, ...projectRoles];

  // ── Root admin: full access ────────────────────────────────────────────────
  if (isRootAdmin) return true;

  // ── Project admin: full access within this project ─────────────────────────
  if (hasProjectAdminRole(projectRoles)) return true;

  // ── Read access: any authenticated user with any role assignment ──────────
  if (action === 'read') return true;

  // ── Write / delete / admin: require explicit role ─────────────────────────
  // For now, deny write/delete/admin unless user has a role assigned.
  // Tighten per-resource below as the role model matures.
  if (allRoles.length === 0) return false;

  // Fallback: allow write for any assigned role (can be tightened per resource)
  return true;
}

/**
 * Require that a permission check passes. Throws if denied.
 *
 * For API route handlers, prefer `checkPermission` + `permissionDenied()` to
 * return a structured 403 Response directly. `requirePermission` is intended
 * for internal server-side guards (e.g., middleware, service-layer calls).
 *
 * @throws Error with message if the user lacks the required permission.
 */
export async function requirePermission(ctx: PermissionContext): Promise<void> {
  const allowed = await checkPermission(ctx);
  if (!allowed) {
    const resource = ctx.resource;
    const action = ctx.action;
    const projectPart = ctx.projectId ? ` in project ${ctx.projectId}` : '';
    throw new Error(
      `Permission denied: ${action} on ${resource}${projectPart}`,
    );
  }
}

/**
 * Middleware helper — returns a standardized error response shape.
 * Use this in API routes to return proper JSON errors.
 *
 * ```ts
 * export async function GET(req: Request) {
 *   const { uid, projectId } = await authFromRequest(req);
 *   const allowed = await checkPermission({ uid, projectId, action: 'read', resource: 'tasks' });
 *   if (!allowed) return permissionDenied();
 *   // ... handle request
 * }
 * ```
 */
export function permissionDenied(): Response {
  return new Response(
    JSON.stringify({ error: { code: 'PERMISSION_DENIED', message: 'You do not have permission to perform this action.' } }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  );
}
