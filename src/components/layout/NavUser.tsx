'use client';

import { EllipsisVertical, LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/lib/api/workspace';

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, loading, logout } = useAuth();
  const { data: workspace } = useWorkspace();
  const router = useRouter();

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' className='opacity-50 cursor-default'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border'>
              <div className='w-4 h-4 rounded-full animate-pulse bg-muted-foreground/30' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <div className='h-3 w-20 rounded animate-pulse bg-muted' />
              <div className='h-2.5 w-28 rounded animate-pulse bg-muted mt-1' />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) return null;

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const email = user.email ?? '';
  const groupLabel = workspace?.permissionGroups?.length
    ? workspace.permissionGroups.join(', ')
    : 'Chưa gán nhóm quyền';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size='lg' className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer'>
              <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border overflow-hidden'>
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt={displayName} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
                ) : (
                  <User className='size-4 text-muted-foreground' />
                )}
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{displayName}</span>
                <span className='truncate text-xs text-muted-foreground'>{email}</span>
                <span className='truncate text-[11px] text-muted-foreground'>Nhóm: {groupLabel}</span>
              </div>
              <EllipsisVertical className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg' side={isMobile ? 'bottom' : 'right'} align='end' sideOffset={4}>
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border overflow-hidden'>
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt={displayName} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
                  ) : (
                    <User className='size-4 text-muted-foreground' />
                  )}
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{displayName}</span>
                  <span className='truncate text-xs text-muted-foreground'>{email}</span>
                  <span className='truncate text-[11px] text-muted-foreground'>Nhóm: {groupLabel}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/profile')} className='cursor-pointer'>
                <User />
                Tài khoản
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings')} className='cursor-pointer'>
                <Settings />
                Cài đặt
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className='cursor-pointer text-destructive focus:text-destructive'>
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
