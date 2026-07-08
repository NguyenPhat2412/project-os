'use client';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/contexts/auth-context';
import { DashboardShell } from './DashboardShell';

/** Paths that should NOT have the app shell / auth guard */
const PUBLIC_PATHS = ['/', '/login'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
