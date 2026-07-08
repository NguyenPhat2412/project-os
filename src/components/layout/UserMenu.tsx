'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOutIcon } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const photoURL = user.photoURL;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='relative w-8 h-8 shrink-0 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-full' title={displayName}>
          <div className='w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-primary to-purple-500 flex items-center justify-center text-[12px] font-bold'>
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoURL} alt={displayName} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
            ) : (
              initials
            )}
          </div>
          <span className='absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-background' />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' side='bottom' sideOffset={8} className='w-64 p-0 overflow-hidden'>
        {/* User Header */}
        <div className='flex items-center gap-3 px-4 py-3 bg-secondary'>
          <div className='w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-primary to-purple-500 flex items-center justify-center text-[14px] font-bold shrink-0'>
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoURL} alt={displayName} className='w-full h-full object-cover' referrerPolicy='no-referrer' />
            ) : (
              initials
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='text-[14px] font-semibold text-foreground truncate'>{displayName}</div>
            <div className='text-[12px] text-muted-foreground truncate'>{user.email}</div>
          </div>
        </div>

        <DropdownMenuSeparator className='my-0' />

        {/* Menu Items */}
        <div className='py-1'>
          <DropdownMenuItem onClick={() => router.push('/profile')} className='gap-2.5 cursor-pointer px-4 py-2.5 text-[13px] focus:bg-secondary'>
            <User className='w-4 h-4 text-muted-foreground' />
            <span>Tài khoản</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push('/admin/settings')} className='gap-2.5 cursor-pointer px-4 py-2.5 text-[13px] focus:bg-secondary'>
            <Settings className='w-4 h-4 text-muted-foreground' />
            <span>Cài đặt</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className='my-0' />

        {/* Logout Button */}
        <div className='py-1.5 px-2'>
          <Button className='w-full gap-2' size='sm' onClick={handleLogout}>
            <LogOutIcon />
            <span>Thoát</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
