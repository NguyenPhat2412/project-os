'use client';

import { Building2Icon, CheckIcon, ChevronDownIcon, Settings2Icon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganizations } from '@/lib/api/organizations';
import { rememberOrganization, useWorkspace } from '@/lib/api/workspace';
import { useProject } from '@/store/project-store';

export function OrganizationSelector() {
  const { data: organizations = [], isLoading } = useOrganizations();
  const { data: workspace } = useWorkspace();
  const { setProjectId } = useProject();
  const pathname = usePathname();
  const router = useRouter();
  const currentId = workspace?.organization.id;

  const selectOrganization = (organizationId: string) => {
    if (organizationId === currentId) return;
    rememberOrganization(organizationId);
    setProjectId('');
    const url = new URL(window.location.href);
    url.searchParams.set('organizationId', organizationId);
    url.searchParams.delete('projectId');
    router.replace(`${pathname}?${url.searchParams.toString()}${url.hash}`, { scroll: false });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label='Chọn tổ chức'
          className='max-w-52 bg-secondary border border-border rounded-sm px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-primary transition-colors text-left'
        >
          <Building2Icon size={14} className='shrink-0 text-primary' />
          <span className='min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground'>
            {workspace?.organization.name ?? (isLoading ? '...' : 'Chọn tổ chức')}
          </span>
          <ChevronDownIcon size={13} className='shrink-0 text-muted-foreground' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side='bottom' align='start' sideOffset={4} className='w-64 p-0'>
        <DropdownMenuLabel className='px-2.5 py-2 text-[12px] text-muted-foreground uppercase tracking-wider border-b border-border'>
          Tổ chức đang làm việc
        </DropdownMenuLabel>
        <div className='py-1'>
          {organizations.map((organization) => (
            <DropdownMenuItem
              key={organization.id}
              onClick={() => selectOrganization(organization.id)}
              className='flex items-center gap-2.5 px-2.5 py-2 cursor-pointer'
            >
              <Building2Icon size={14} className='text-muted-foreground' />
              <div className='min-w-0 flex-1'>
                <div className='truncate text-[12px] font-medium'>{organization.name}</div>
                <div className='truncate text-[11px] text-muted-foreground'>{organization.timezone}</div>
              </div>
              {organization.id === currentId && <CheckIcon size={13} className='text-primary' />}
            </DropdownMenuItem>
          ))}
          {!organizations.length && !isLoading && (
            <DropdownMenuItem disabled className='px-3 py-4 text-center text-muted-foreground'>
              Chưa có tổ chức
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href={`/organization${currentId ? `?organizationId=${currentId}` : ''}`} className='flex items-center gap-2 px-2.5 py-1.5'>
            <Settings2Icon size={13} /> Quản lý tổ chức & nhóm
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
