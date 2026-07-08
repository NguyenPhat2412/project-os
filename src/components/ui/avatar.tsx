'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

/* Gradient colors for initials fallback */
const GRADIENT_MAP: Record<string, string> = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  red: 'from-red-400 to-red-600',
  purple: 'from-violet-400 to-violet-600',
  orange: 'from-orange-400 to-orange-600',
  pink: 'from-pink-400 to-pink-600',
  cyan: 'from-cyan-400 to-cyan-600',
  amber: 'from-amber-400 to-amber-600',
  teal: 'from-teal-400 to-teal-600',
  indigo: 'from-indigo-400 to-indigo-600',
};

function getGradient(color?: string): string {
  return color && GRADIENT_MAP[color] ? GRADIENT_MAP[color] : 'from-slate-400 to-slate-600';
}

function Avatar({
  className,
  size = 'default',
  initials,
  color,
  gradient,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'default' | 'sm' | 'lg' | 'md';
  initials?: string;
  color?: string;
  gradient?: string;
}) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      data-size={size}
      className={cn(
        'group/avatar relative flex shrink-0 overflow-hidden rounded-full select-none',
        'size-8 data-[size=lg]:size-10 data-[size=sm]:size-6 data-[size=md]:size-7',
        className,
      )}
      {...props}
    >
      <AvatarPrimitive.Image data-slot='avatar-image' className='aspect-square size-full' />
      <AvatarPrimitive.Fallback
        data-slot='avatar-fallback'
        className={cn(
          'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground',
          'group-data-[size=sm]/avatar:text-xs group-data-[size=md]/avatar:text-[13px]',
          gradient
            ? 'bg-linear-to-br text-white font-semibold'
            : color
            ? `bg-linear-to-br ${getGradient(color)} text-white font-semibold`
            : '',
        )}
      >
        {initials ? (
          <span className={cn(gradient ? 'bg-clip-text' : '')} style={gradient && !color ? { background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}>
            {initials}
          </span>
        ) : null}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot='avatar-image' className={cn('aspect-square size-full', className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return <AvatarPrimitive.Fallback data-slot='avatar-fallback' className={cn('flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs', className)} {...props} />;
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot='avatar-badge'
      className={cn(
        'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='avatar-group' className={cn('group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background', className)} {...props} />;
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='avatar-group-count'
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount };