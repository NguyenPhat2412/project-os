'use client';
import type { ReactNode } from 'react';

interface DashboardSectionProps {
  icon: ReactNode;
  iconColor?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function DashboardSection({ icon, iconColor = 'var(--primary)', title, subtitle, action, children }: DashboardSectionProps) {
  return (
    <section className='mb-8'>
      <div className='flex items-center gap-3 mb-4 pb-3.5 border-b border-border'>
        <div
          className='w-8 h-8 rounded-sm flex items-center justify-center shrink-0'
          style={{
            background: `color-mix(in srgb, ${iconColor} 14%, transparent)`,
            color: iconColor,
          }}
        >
          {icon}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='font-sans text-[15px] font-bold leading-none'>{title}</div>
          {subtitle && <div className='text-[12px] text-muted-foreground mt-1'>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
