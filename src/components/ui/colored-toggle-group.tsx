'use client';

import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/ui/toggle';

/**
 * ColoredToggleGroup — single-select toggle group with per-item colored active states.
 * Use when you need Priority / Severity / Level selectors that highlight the selected item
 * with a custom color while keeping the rest in an inactive state.
 *
 * @example
 * <ColoredToggleGroup
 *   items={[{ value: 'High', label: 'High' }, { value: 'Low', label: 'Low' }]}
 *   value={field.value}
 *   onValueChange={field.onChange}
 *   colorMap={{
 *     High:  { active: '#ef4444', inactive: { background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'var(--border)' } },
 *     Low:   { active: '#22c55e', inactive: { background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'var(--border)' } },
 *   }}
 * />
 */
export type ColorMap = Record<string, { active: string; inactive: { background?: string; color?: string; border?: string } }>;

export function ColoredToggleGroup({
  className,
  colorMap,
  items,
  value,
  onValueChange,
  disabled,
  size = 'default' as const,
}: {
  className?: string;
  items: { value: string; label: string }[];
  value: string;
  onValueChange: (v: string) => void;
  disabled?: boolean;
  colorMap: ColorMap;
  size?: 'sm' | 'default' | 'lg';
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot='toggle-group'
      className={cn('inline-flex items-center justify-center rounded-md w-full', className)}
      type='single'
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      disabled={disabled}
    >
      {items.map((item) => {
        const colors = colorMap[item.value];
        const isActive = value === item.value;
        return (
          <ToggleGroupPrimitive.Item
            key={item.value}
            value={item.value}
            data-slot='toggle-group-item'
            className={cn(
              toggleVariants({ variant: 'default', size }),
              'flex-1 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10',
            )}
            style={
              colors
                ? {
                    background: isActive ? colors.active : colors.inactive.background ?? 'var(--secondary)',
                    color: isActive ? 'white' : colors.inactive.color ?? 'var(--muted-foreground)',
                    borderColor: isActive ? colors.active : colors.inactive.border ?? 'var(--border)',
                  }
                : undefined
            }
          >
            {item.label}
          </ToggleGroupPrimitive.Item>
        );
      })}
    </ToggleGroupPrimitive.Root>
  );
}
