'use client';

import Link from 'next/link';
import {
  BarChart2Icon,
  BellIcon,
  BotIcon,
  BugIcon,
  CalendarDaysIcon,
  CheckSquareIcon,
  ClipboardListIcon,
  FileTextIcon,
  FolderKanbanIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  LayoutListIcon,
  ShieldAlertIcon,
  ShieldIcon,
  UsersIcon,
  VideoIcon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from '@/components/ui/sidebar';
import { NavMain, type NavItem } from './NavMain';
import { NavUser } from './NavUser';
import { usePermission } from '@/hooks/usePermission';
import type { ComponentProps } from 'react';

/* ── Nav data ─────────────────────────────────────────────────────────────── */

const NAV_MAIN: NavItem[] = [
  { title: 'Tổng hợp (Dashboard)', url: '/dashboard', icon: LayoutDashboardIcon, iconClassName: 'text-sky-600' },
  { title: 'Dự án (Projects)', url: '/projects', icon: FolderKanbanIcon, iconClassName: 'text-violet-600' },
  { title: 'Tiến độ (Timeline)', url: '/timeline', icon: CalendarDaysIcon, iconClassName: 'text-cyan-600' },
  { title: 'Yêu cầu (Backlog)', url: '/backlog', icon: ClipboardListIcon, iconClassName: 'text-amber-600' },
  { title: 'Giai đoạn (Sprints)', url: '/sprint', icon: ZapIcon, iconClassName: 'text-emerald-600' },
  { title: 'Công việc (Tasks)', url: '/tasks', icon: CheckSquareIcon, iconClassName: 'text-green-600' },
  { title: 'Quản lý lỗi (Bugs)', url: '/bugs', icon: BugIcon, iconClassName: 'text-rose-600' },
];

const NAV_MANAGE: NavItem[] = [
  { title: 'Nhân sự (Team)', url: '/team', icon: UsersIcon, iconClassName: 'text-fuchsia-600' },
  { title: 'Ngân sách (Budget)', url: '/budget', icon: WalletIcon, iconClassName: 'text-emerald-700' },
  { title: 'Rủi ro (Risks)', url: '/risk', icon: ShieldAlertIcon, iconClassName: 'text-orange-600' },
  { title: 'Tài liệu (Documents)', url: '/docs', icon: FolderOpenIcon, iconClassName: 'text-amber-700' },
  { title: 'Wiki', url: '/wiki', icon: FileTextIcon, iconClassName: 'text-blue-600' },
];

const NAV_COMM: NavItem[] = [
  { title: 'Cuộc họp (Meetings)', url: '/meetings', icon: VideoIcon, iconClassName: 'text-indigo-600' },
  { title: 'Hoạt động (Activity)', url: '/activity', icon: BellIcon, iconClassName: 'text-rose-500' },
  {
    title: 'Báo cáo (Reports)',
    url: '/reports',
    icon: BarChart2Icon,
    iconClassName: 'text-cyan-700',
    items: [
      { title: 'Báo cáo công việc', url: '/reports/tasks' },
      { title: 'Báo cáo lỗi', url: '/reports/bugs' },
      { title: 'Báo cáo rủi ro', url: '/reports/risks' },
    ],
  },
];

const NAV_ADMIN: NavItem[] = [
  { title: 'Vai trò (Root)', url: '/admin/roles', icon: ShieldIcon, iconClassName: 'text-red-600' },
  { title: 'Quản lý danh sách dự án', url: '/admin/projects', icon: FolderOpenIcon, iconClassName: 'text-violet-600' },
  { title: 'Quản lý nhân sự', url: '/admin/members', icon: UsersIcon, iconClassName: 'text-fuchsia-600' },
  { title: 'Cấu hình Tasks', url: '/admin/tasks', icon: LayoutListIcon, iconClassName: 'text-blue-600' },
  { title: 'Cấu hình Bugs', url: '/admin/bugs', icon: BugIcon, iconClassName: 'text-rose-600' },
  { title: 'Cấu hình AI', url: '/admin/settings', icon: BotIcon, iconClassName: 'text-teal-600' },
];

/* ── Component ────────────────────────────────────────────────────────────── */

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { isRootAdmin, hydrated } = usePermission();

  return (
    <Sidebar {...props}>
      {/* Header — logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/dashboard'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20'>
                  <svg width='18' height='18' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <rect x='2' y='2' width='24' height='24' rx='5' fill='var(--primary)' fillOpacity='0.15' stroke='var(--primary)' strokeWidth='1.5' />
                    <rect x='6' y='6' width='6' height='6' rx='1.5' fill='var(--primary)' />
                    <rect x='16' y='6' width='6' height='6' rx='1.5' fill='var(--primary)' fillOpacity='0.6' />
                    <rect x='6' y='16' width='6' height='6' rx='1.5' fill='var(--primary)' fillOpacity='0.6' />
                    <rect x='16' y='16' width='6' height='6' rx='1.5' fill='var(--primary)' fillOpacity='0.3' />
                  </svg>
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-extrabold tracking-tight'>Project OS</span>
                  <span className='truncate text-xs text-muted-foreground'>Enterprise Edition</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content — nav groups */}
      <SidebarContent>
        <NavMain label='Chính' items={NAV_MAIN} />
        <NavMain label='Quản lý' items={NAV_MANAGE} />
        <NavMain label='Giao tiếp' items={NAV_COMM} />
        {hydrated && isRootAdmin() && <NavMain label='Admin' items={NAV_ADMIN} />}
      </SidebarContent>

      {/* Footer — user dropdown */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
