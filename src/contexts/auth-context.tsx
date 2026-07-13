'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { platformAuth } from '@/lib/platform-api/client';
import { profileConfig } from '@/lib/project-config';
import { projectsCollection } from '@/modules/projects/collections/projects';
import { useAuthStore } from '@/store/auth-store';
import { useProjectStore } from '@/store/project-store';

const toAuthUser = (user: Awaited<ReturnType<typeof platformAuth.me>>) => ({
  uid: user.id,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.avatarUrl,
  role: user.role,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setRootRoles = useAuthStore((state) => state.setRootRoles);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const user = await platformAuth.me();
        if (!active) return;
        setUser(toAuthUser(user));
        setRootRoles([user.role]);

        // Validate the persisted project before any project-scoped screen is
        // rendered. A stale project UUID must never send requests to a project
        // the user can no longer access.
        try {
          const projects = await projectsCollection.helpers.fetchList();
          if (!active) return;
          const currentProjectId = useProjectStore.getState().projectId;
          const canAccessCurrentProject = projects.some((project) => project.id === currentProjectId);
          if (!canAccessCurrentProject && projects[0]?.id) {
            useProjectStore.getState().setProjectId(projects[0].id);
          }
        } catch {
          // The project list owns its own error UI. Authentication remains valid.
        }

        try {
          const profile = await profileConfig.helpers.fetch(user.id);
          if (active) setProfile(profile ?? null);
        } catch {
          if (active) setProfile(null);
        }
      } catch {
        if (active) clearAuth();
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [clearAuth, setLoading, setProfile, setRootRoles, setUser]);

  return <>{children}</>;
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setProfile = useAuthStore((state) => state.setProfile);

  return {
    user,
    profile,
    loading,
    logout: async () => {
      try {
        await platformAuth.logout();
      } finally {
        clearAuth();
        window.location.assign('/login');
      }
    },
    refreshProfile: async () => {
      if (!user) return;
      const nextProfile = await profileConfig.helpers.fetch(user.uid);
      setProfile(nextProfile ?? null);
    },
  };
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center bg-background'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
          <span className='text-[13px] text-muted-foreground'>Đang tải…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
