'use client';
import { AdminGuard } from '@/components/ui/shared/admin-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
