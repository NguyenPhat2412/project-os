'use client';
import Link from 'next/link';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { cn } from '@/lib/utils';

type BadgeColor = 'red' | 'green' | 'yellow' | 'purple';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  badgeColor?: BadgeColor;
  onClick?: () => void;
}

const badgeBg: Record<BadgeColor, string> = {
  red: 'bg-red-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-foreground',
  purple: 'bg-purple-500 text-white',
};

export function NavItem({ href, icon, label, badge, badgeColor = 'red', onClick }: NavItemProps) {
  const isActive = useActiveRoute()(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2.25 rounded-1.5 px-3.5 py-2.25 mx-2 text-[13.5px] font-medium transition-colors duration-120',
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      {isActive && <span className='absolute -left-2 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-primary rounded-r' />}
      <span className='w-4.5 flex items-center justify-center shrink-0'>{icon}</span>
      <span className='flex-1'>{label}</span>
      {badge !== undefined && <span className={cn('ml-auto font-mono text-[12px] font-bold px-1.5 py-px rounded-2.5', badgeBg[badgeColor])}>{badge}</span>}
    </Link>
  );
}
