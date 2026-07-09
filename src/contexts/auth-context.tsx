'use client';
import { useEffect } from 'react';
import { signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { rootMembersCollection } from '@/modules/root/collections/root-members';
import { profileConfig } from '@/lib/project-config';

const logout = async (clearAuth: () => void) => {
  await nextAuthSignOut({ redirect: false });
  clearAuth();
  window.location.assign('/login');
};

// ─── Auth Provider Component ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setRootRoles = useAuthStore((s) => s.setRootRoles);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const sessionUserEmail = session?.user?.email ?? null;
  const sessionUserName = session?.user?.name ?? null;
  const sessionUserImage = session?.user?.image ?? null;

  useEffect(() => {
    if (!sessionUserId) {
      clearAuth();
      return;
    }

    setUser({
      uid: sessionUserId,
      email: sessionUserEmail,
      displayName: sessionUserName,
      photoURL: sessionUserImage,
    });

    const loadData = async () => {
      try {
        const [member, profile] = await Promise.all([
          rootMembersCollection.helpers.fetch(sessionUserId),
          profileConfig.helpers.fetch(sessionUserId),
        ]);
        setRootRoles(member?.roles ?? []);
        setProfile(profile ?? null);
      } catch {
        setRootRoles([]);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sessionUserId, sessionUserEmail, sessionUserName, sessionUserImage, setUser, setRootRoles, setProfile, setLoading, clearAuth]);

  return <>{children}</>;
}

// ─── useAuth Hook ─────────────────────────────────────────────────────────────

export function useAuth() {
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setProfile = useAuthStore((s) => s.setProfile);

  const { data: session, status } = useSession();

  const isLoading = status === 'loading' || loading;

  const authUser = session?.user
    ? {
        uid: session.user.id,
        email: session.user.email ?? null,
        displayName: session.user.name ?? null,
        photoURL: session.user.image ?? null,
      }
    : null;

  return {
    user: authUser,
    profile,
    loading: isLoading,
    logout: () => logout(clearAuth),
    refreshProfile: async () => {
      if (session?.user?.id) {
        const profile = await profileConfig.helpers.fetch(session.user.id);
        setProfile(profile ?? null);
      }
    },
  };
}

// ─── Auth Guard ──────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center bg-background'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
          <span className='text-[13px] text-muted-foreground'>Đang tải…</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return <>{children}</>;
}
