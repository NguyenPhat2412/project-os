'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { PageLoader } from '@/components/ui/page-loader';

interface AdminGuardProps {
  children: ReactNode;
  /** Optional: require specific project admin role */
  projectId?: string;
}

export function AdminGuard({ children, projectId }: AdminGuardProps) {
  const { isRootAdmin, isProjectAdmin, hydrated } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    const hasAccess = projectId ? isProjectAdmin(projectId) : isRootAdmin();
    if (!hasAccess) {
      router.replace('/dashboard');
    }
  }, [hydrated, projectId, isRootAdmin, isProjectAdmin, router]);

  if (!hydrated) {
    return (
      <div className='flex h-screen items-center justify-center bg-background'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
          <span className='text-[13px] text-muted-foreground'>Đang kiểm tra quyền truy cập…</span>
        </div>
      </div>
    );
  }

  const hasAccess = projectId ? isProjectAdmin(projectId) : isRootAdmin();
  if (!hasAccess) return null;

  return <>{children}</>;
}
