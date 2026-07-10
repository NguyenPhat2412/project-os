/**
 * Auth Store — Zustand với persistence.
 *
 * Quản lý auth state + roles (root + project) với localStorage persistence.
 * Roles sống qua reload trang.
 *
 * Admin access:
 * - Emails from ADMIN_EMAILS/NEXT_PUBLIC_ADMIN_EMAILS → full admin access
 * - Role "Administrators" (root) → full admin access (immutable)
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UserProfile } from '@/lib/project-config';
import { getClientAdminEmails, isAdminEmail, ROOT_ADMIN_ROLE } from '@/lib/admin-emails';

// ─── Auth User Type (replaces Firebase User) ────────────────────────────────

/** Plain user object from NextAuth session — replaces Firebase User */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const ADMIN_EMAILS = getClientAdminEmails();
export { ROOT_ADMIN_ROLE };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthState {
  // NextAuth user (plain object — replaces Firebase User)
  user: AuthUser | null;
  // App-level profile
  profile: UserProfile | null;
  // Root-level roles (from members/{uid}/roles)
  rootRoles: string[];
  // Project-level roles (from projects/{pid}/team_members/{uid}/roles)
  projectRoles: Record<string, string[]>;
  // Loading state
  loading: boolean;
  // Hydration done
  hydrated: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export interface AuthActions {
  // Set user (from NextAuth session)
  setUser: (user: AuthUser | null) => void;
  // Set profile
  setProfile: (profile: UserProfile | null) => void;
  // Set root roles (from Firestore)
  setRootRoles: (roles: string[]) => void;
  // Set project roles for a specific project
  setProjectRoles: (projectId: string, roles: string[]) => void;
  // Merge root + project roles
  getAllRoles: () => string[];
  // Check if user has a specific role
  hasRole: (role: string, projectId?: string) => boolean;
  // Check if user is root admin (Administrators role OR admin email)
  isRootAdmin: () => boolean;
  // Check if user is admin (root admin OR has role in any project)
  isAdmin: () => boolean;
  // Check if user is admin for a specific project
  isProjectAdmin: (projectId: string) => boolean;
  // Set loading
  setLoading: (loading: boolean) => void;
  // Set hydrated flag
  setHydrated: (hydrated: boolean) => void;
  // Clear all auth state (logout)
  clearAuth: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        profile: null,
        rootRoles: [],
        projectRoles: {},
        loading: true,
        hydrated: false,

        setUser: (user) => set({ user }),

        setProfile: (profile) => set({ profile }),

        setRootRoles: (roles) => set({ rootRoles: roles }),

        setProjectRoles: (projectId, roles) =>
          set((state) => ({
            projectRoles: { ...state.projectRoles, [projectId]: roles },
          })),

        getAllRoles: () => {
          const { rootRoles, projectRoles } = get();
          const projectRolesFlat = Object.values(projectRoles).flat();
          return [...rootRoles, ...projectRolesFlat];
        },

        hasRole: (role, projectId) => {
          const { rootRoles, projectRoles } = get();
          if (rootRoles.includes(role)) return true;
          if (projectId && projectRoles[projectId]?.includes(role)) return true;
          return false;
        },

        isRootAdmin: () => {
          const { user, rootRoles } = get();
          return rootRoles.includes(ROOT_ADMIN_ROLE) || rootRoles.includes('ROOT_ADMIN') || user?.role === 'ROOT_ADMIN' || isAdminEmail(user?.email, ADMIN_EMAILS);
        },

        isAdmin: () => {
          return get().isRootAdmin();
        },

        isProjectAdmin: (projectId) => {
          const { isRootAdmin, projectRoles } = get();
          if (isRootAdmin()) return true;
          return projectRoles[projectId]?.some((role) => role === 'Project Admin' || role === 'PROJECT_ADMIN') ?? false;
        },

        setLoading: (loading) => set({ loading }),

        setHydrated: (hydrated) => set({ hydrated }),

        clearAuth: () =>
          set({
            user: null,
            profile: null,
            rootRoles: [],
            projectRoles: {},
            loading: false,
          }),
      }),
      {
        name: 'projectos-auth', // localStorage key
        // Only persist app state — user comes from NextAuth session on each load
        partialize: (state) => ({
          profile: state.profile,
          rootRoles: state.rootRoles,
          projectRoles: state.projectRoles,
          hydrated: state.hydrated,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated(true);
        },
      },
    ),
    {
      name: 'Auth Store',
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectUser = (state: AuthState & AuthActions) => state.user;
export const selectProfile = (state: AuthState & AuthActions) => state.profile;
export const selectRootRoles = (state: AuthState & AuthActions) => state.rootRoles;
export const selectProjectRoles = (state: AuthState & AuthActions) => state.projectRoles;
export const selectIsAdmin = (state: AuthState & AuthActions) => state.isAdmin();
export const selectIsRootAdmin = (state: AuthState & AuthActions) => state.isRootAdmin();
