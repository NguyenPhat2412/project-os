/**
 * usePermission hook — permission checks using Zustand auth store.
 *
 * Usage:
 * ```ts
 * const { isRootAdmin, isAdmin, hasRole } = usePermission();
 *
 * if (isRootAdmin()) { ... }
 * if (hasRole('Project Admin', projectId)) { ... }
 * ```
 */
import { useAuth } from '@/contexts/auth-context';
import { useAuthStore, ROOT_ADMIN_ROLE, ADMIN_EMAILS } from '@/store/auth-store';
import { isAdminEmail } from '@/lib/admin-emails';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePermission() {
  const { user, loading } = useAuth();
  const rootRoles = useAuthStore((s) => s.rootRoles);
  const projectRoles = useAuthStore((s) => s.projectRoles);
  const hydrated = useAuthStore((s) => s.hydrated);
  const ready = hydrated && !loading;

  /**
   * Check if user has a specific role.
   * @param role - Role name to check
   * @param projectId - Optional project scope
   */
  const hasRole = (role: string, projectId?: string): boolean => {
    if (!ready) return false;
    if (rootRoles.includes(ROOT_ADMIN_ROLE) || rootRoles.includes('ROOT_ADMIN') || user?.role === 'ROOT_ADMIN') return true;
    if (rootRoles.includes(role)) return true;
    if (projectId && projectRoles[projectId]?.includes(role)) return true;
    return false;
  };

  /**
   * Check if user has ANY of the specified roles.
   * @param roles - Array of role names
   * @param projectId - Optional project scope
   */
  const hasAnyRole = (roles: string[], projectId?: string): boolean => {
    return roles.some((role) => hasRole(role, projectId));
  };

  /**
   * Check if user is root admin (Administrators role OR admin email).
   */
  const isRootAdmin = (): boolean => {
    if (!ready) return false;
    return rootRoles.includes(ROOT_ADMIN_ROLE) || rootRoles.includes('ROOT_ADMIN') || user?.role === 'ROOT_ADMIN' || isAdminEmail(user?.email, ADMIN_EMAILS);
  };

  /**
   * Check if user is admin (root admin OR project admin).
   */
  const isAdmin = (): boolean => {
    return isRootAdmin();
  };

  /**
   * Check if user is admin for a specific project.
   */
  const isProjectAdmin = (projectId: string): boolean => {
    if (!ready) return false;
    if (isRootAdmin()) return true;
    return projectRoles[projectId]?.some((role) => role === 'Project Admin' || role === 'PROJECT_ADMIN') ?? false;
  };

  /**
   * Get all roles for this user (root + project).
   */
  const getAllRoles = (): string[] => {
    const projectRolesFlat = Object.values(projectRoles).flat();
    return [...rootRoles, ...projectRolesFlat];
  };

  /**
   * Get project roles for a specific project.
   */
  const getProjectRoles = (projectId: string): string[] => {
    return projectRoles[projectId] ?? [];
  };

  return {
    // State
    user,
    rootRoles,
    projectRoles,
    hydrated: ready,
    // Checks
    hasRole,
    hasAnyRole,
    isRootAdmin,
    isAdmin,
    isProjectAdmin,
    getAllRoles,
    getProjectRoles,
  };
}

// ─── Constants re-export ────────────────────────────────────────────────────

export { ROOT_ADMIN_ROLE, ADMIN_EMAILS } from '@/store/auth-store';
