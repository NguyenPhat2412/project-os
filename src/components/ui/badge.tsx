import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-0.75 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-90',
        secondary: 'bg-secondary text-muted-foreground hover:bg-muted',
        destructive: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
        success: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
        info: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
        orange: 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/28',
        rose: 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/28',
        cyan: 'bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/28',
        outline: 'border-border text-foreground hover:bg-secondary',
        ghost: 'hover:bg-secondary hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps extends React.ComponentProps<'span'> {
  variant?: VariantProps<typeof badgeVariants>['variant'];
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span data-slot='badge' className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
