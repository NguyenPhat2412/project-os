'use client';
import Link from 'next/link';
import { BellIcon, GlobeIcon, SettingsIcon } from 'lucide-react';
import { ThemeCustomizerTrigger } from '@/components/theme-customizer';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProjectSelector } from '@/modules/projects/components/ProjectSelector';

export function Topbar({ onOpenCustomizer }: { onOpenCustomizer: () => void }) {
  return (
    <header className='h-15 border-b border-border flex items-center px-4 gap-3 shrink-0'>
      <SidebarTrigger className='text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8' />

      <div className='flex items-center gap-2'>
        <ProjectSelector />
        {/* <SearchBar /> */}
      </div>

      <div className='ml-auto flex items-center gap-2'>
        <Button asChild variant='outline' size='icon' className='bg-secondary border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-secondary' title='Settings'>
          <Link href='/admin/settings'>
            <SettingsIcon size={15} />
          </Link>
        </Button>
        <Button asChild variant='outline' size='icon' className='bg-secondary border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-secondary' title='Language'>
          <Link href='#'>
            <GlobeIcon size={15} />
          </Link>
        </Button>
        <ThemeCustomizerTrigger onClick={onOpenCustomizer} />
        <Button asChild variant='outline' size='icon' className='relative bg-secondary border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-secondary' title='Notifications'>
          <Link href='/activity'>
            <BellIcon size={15} />
            <span className='absolute top-1.5 right-1.5 w-1.75 h-1.75 bg-red-500 rounded-full pulse-dot' />
          </Link>
        </Button>
      </div>
    </header>
  );
}
