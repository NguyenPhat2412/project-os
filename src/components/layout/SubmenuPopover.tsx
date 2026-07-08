'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronRight } from 'lucide-react';

interface SubmenuItem {
  href: string;
  label: string;
}

interface SubmenuPopoverProps {
  icon: React.ReactNode;
  label: string;
  items: SubmenuItem[];
  isActive: boolean;
  isCollapsed: boolean;
  colorClass?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: () => void;
}

export function SubmenuPopover({ icon, label, items, isActive, isCollapsed, colorClass = 'text-indigo-500', open, onOpenChange, onNavigate }: SubmenuPopoverProps) {
  const router = useRouter();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const handleNavigate = (href: string) => {
    router.push(href);
    onOpenChange?.(false);
    onNavigate?.();
  };

  if (!isCollapsed) {
    return null;
  }

  return (
    <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button
              className={`relative flex w-full items-center gap-2 overflow-hidden rounded-sm p-2 text-left text-sm outline-none transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
            >
              <span className={isActive ? 'text-white [&_svg]:text-white' : colorClass}>{icon}</span>
              <ChevronRight size={12} className='ml-auto shrink-0' />
            </button>
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent side='right' align='start' sideOffset={8} className='w-52 p-0 bg-card border border-border panel-modal'>
          {/* Header */}
          <div className='flex items-center gap-2 px-3 py-2.5 border-b border-border'>
            <span className={isActive ? 'text-primary-foreground [&_svg]:text-primary-foreground' : colorClass}>{icon}</span>
            <span className='text-[13px] font-semibold text-foreground'>{label}</span>
          </div>
          {/* Items */}
          <div className='py-1'>
            {items.map((item) => (
              <button key={item.href} onClick={() => handleNavigate(item.href)} className='w-full flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left'>
                <span className='w-1.5 h-1.5 rounded-full bg-current shrink-0' />
                {item.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent side='right'>{label}</TooltipContent>
    </Tooltip>
  );
}
