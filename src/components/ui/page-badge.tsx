import { cn } from '@/lib/utils';

type BadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

interface PageBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  red: 'bg-red-500/10 text-red-500',
  green: 'bg-green-500/10 text-green-500',
  yellow: 'bg-yellow-500/10 text-yellow-500',
  accent: 'bg-primary/10 text-primary',
  purple: 'bg-purple-500/10 text-purple-500',
  muted: 'bg-muted text-muted-foreground',
};

export function PageBadge({ children, variant = 'muted', className }: PageBadgeProps) {
  return (
    <span data-slot='badge' className={cn('inline-flex items-center gap-1 font-mono-dm text-[10px] font-semibold uppercase tracking-[0.6px] px-2 py-0.5 rounded-sm', variants[variant], className)}>
      {children}
    </span>
  );
}
