import { cookies } from 'next/headers';

interface SpringUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
}

/**
 * Compatibility bridge for legacy Next route handlers during the rollout.
 * Spring Identity remains the only authentication authority.
 */
export async function auth(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
  if (!cookieHeader.includes('PROJECT_OS_ACCESS=')) return null;

  const origin = (process.env.PROJECT_OS_API_INTERNAL_URL ?? 'http://127.0.0.1:18080').replace(/\/$/, '');
  const response = await fetch(`${origin}/api/v1/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const body = (await response.json()) as { data: SpringUser };
  return {
    user: {
      id: body.data.id,
      name: body.data.displayName,
      email: body.data.email,
      image: body.data.avatarUrl,
      role: body.data.role,
    },
  };
}
