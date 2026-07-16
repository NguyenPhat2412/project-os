'use client'

import { ChevronRight, ClipboardListIcon, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useWorkspace } from '@/lib/api/workspace'

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  iconClassName?: string
  badge?: string
  badgeClass?: string
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({
  label,
  items,
}: {
  label: string
  items: NavItem[]
}) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { data: workspace } = useWorkspace()
  const moduleByRoute: Record<string, string> = {
    '/dashboard': 'dashboard', '/projects': 'projects', '/timeline': 'project-management',
    '/backlog': 'project-management', '/sprint': 'project-management', '/tasks': 'tasks',
    '/bugs': 'project-management', '/organization': 'organization', '/attendance': 'attendance',
    '/team': 'employees', '/budget': 'operations', '/risk': 'operations', '/docs': 'knowledge',
    '/wiki': 'knowledge', '/meetings': 'meetings', '/activity': 'activity', '/reports': 'reports',
  }
  const modules = new Set(workspace?.modules ?? [])
  if (modules.has('operations')) modules.add('meetings')
  const withOrganization = (url: string) => {
    const organizationId = workspace?.organization.id
    if (!organizationId) return url
    return `${url}${url.includes('?') ? '&' : '?'}organizationId=${organizationId}`
  }
  const scopedItems = workspace
    ? items.filter((item) => !moduleByRoute[item.url] || modules.has(moduleByRoute[item.url]))
    : items
  const visibleItems = scopedItems.some((item) => item.url === '/attendance') && modules.has('daily-reports')
    ? [...scopedItems, { title: 'Báo cáo ngày', url: '/daily-reports', icon: ClipboardListIcon, iconClassName: 'text-sky-600' }]
    : scopedItems

  const isActive = (url: string) =>
    pathname === url || (url !== '/' && pathname.startsWith(url + '/'))

  const shouldBeOpen = (item: NavItem) =>
    item.items?.some((sub) => isActive(sub.url)) ?? false

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={shouldBeOpen(item)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className="cursor-pointer"
                      isActive={shouldBeOpen(item)}
                    >
                      {item.icon && <item.icon className={item.iconClassName} />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className="cursor-pointer"
                            isActive={pathname === subItem.url}
                          >
                            <Link
                              href={withOrganization(subItem.url)}
                              onClick={() => setOpenMobile(false)}
                            >
                              <span className="w-1.5 h-1.5 rounded-full border border-current opacity-50 shrink-0" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className="cursor-pointer"
                  isActive={isActive(item.url)}
                >
                  <Link href={withOrganization(item.url)} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon className={item.iconClassName} />}
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span
                        className={`${item.badgeClass ?? 'bg-red-500 text-white'} text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
