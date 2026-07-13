// Auth + shell are handled by LayoutShell in the root layout.
// Authenticated screens depend on the runtime Spring API session.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
