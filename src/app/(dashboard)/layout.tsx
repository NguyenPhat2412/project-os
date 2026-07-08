// Auth + shell are handled by LayoutShell in the root layout.
// force-dynamic: prevent Next.js from prerendering at build time
// (Firebase requires real env vars available only at runtime)
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
