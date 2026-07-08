'use client';
import { useState, useMemo } from 'react';
import { SearchIcon, UserPlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/page-loader';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { TeamStatsPanel } from '@/modules/team/components/TeamStatsPanel';
import { TeamMembersTable } from '@/modules/team/components/TeamMembersTable';
import { MemberCardGrid } from '@/modules/team/components/MemberCardGrid';
import { TeamMemberViewSheet } from '@/modules/team/components/TeamMemberViewSheet';
import { AddMemberModal } from '@/modules/team/components/AddMemberModal';
import { UpdateRoleModal } from '@/modules/team/components/UpdateRoleModal';
import { projectMembersCollection } from '@/modules/team/collections/team';
import { membersCollection } from '@/modules/team/collections/members';
import { roleDefinitionsCollection } from '@/modules/project-roles/collections/role-definitions';
import { tasksCollection } from '@/modules/tasks/collections/tasks';
import { taskColumnsCollection } from '@/modules/tasks/collections/taskColumns';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { getStatusFromWorkload } from '@/modules/team/types/team';
import type { Member, TeamMemberWithRole, ProjectTeamMember } from '@/modules/team/types/team';
import type { Task, TaskColumn } from '@/modules/tasks/types/task';
import type { Bug } from '@/modules/bugs/types/bug';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';

const ALL = 'all' as const;

interface Props {
  projectId: string;
}

export function ProjectMembersPanel({ projectId }: Props) {
  const projectMembersCol = projectMembersCollection(projectId);
  const { data: projectMemberships, isLoading: loadingMemberships } = projectMembersCol.useList() as { data: (ProjectTeamMember & { id: string })[]; isLoading: boolean };
  const { data: globalMembersData, isLoading: loadingGlobalMembers } = membersCollection.useList();
  const { data: roleDefsData } = roleDefinitionsCollection(projectId).useList();
  const { data: tasksData } = tasksCollection.useList();
  const { data: columnsData } = taskColumnsCollection.useList();
  const { data: bugsData } = bugsCollection.useList();

  const setMember = projectMembersCol.useSet();
  const updateMember = projectMembersCol.useUpdate();
  const deleteMember = projectMembersCol.useDelete();

  const globalMembers = useMemo(() => (globalMembersData ?? []) as Member[], [globalMembersData]);
  const roleDefs = useMemo(() => (roleDefsData ?? []) as RoleDefinition[], [roleDefsData]);
  const tasks = useMemo(() => (tasksData ?? []) as unknown as Task[], [tasksData]);
  const columns = useMemo(() => (columnsData ?? []) as unknown as TaskColumn[], [columnsData]);
  const bugs = useMemo(() => (bugsData ?? []) as unknown as Bug[], [bugsData]);

  const doneColumnIds = useMemo(() => new Set(columns.filter((c) => c.isDone).map((c) => c.id)), [columns]);

  // Build lookup map from root member id → member data
  const memberMap = useMemo(() => new Map((globalMembersData ?? []).map((m) => [m.id, m as Member])), [globalMembersData]);

  const teamMembers = useMemo((): TeamMemberWithRole[] => {
    return ((projectMemberships ?? []) as (ProjectTeamMember & { id: string })[])
      .map((pm) => {
        const root = memberMap.get(pm.memberId);
        if (!root) return null;
        const activeTasks = tasks.filter((t) => t.assigneeId === pm.memberId && !doneColumnIds.has(t.status)).length;
        const activeBugs = bugs.filter((b) => b.assigneeId === pm.memberId && !['fixed', 'wont-fix'].includes(b.status)).length;
        const taskCount = activeTasks + activeBugs;
        const workload = Math.min(100, Math.round((taskCount / 10) * 100));
        const status = getStatusFromWorkload(workload);

        return {
          id: root.id,
          name: root.name,
          displayName: root.displayName,
          email: root.email,
          initials: root.initials,
          gradient: root.gradient,
          roles: pm.roles,
          taskCount,
          workload,
          status,
        } as TeamMemberWithRole;
      })
      .filter((m): m is TeamMemberWithRole => m !== null);
  }, [projectMemberships, memberMap, tasks, bugs, doneColumnIds]);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>(ALL);
  const [view, setView] = useState<'list' | 'card'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<TeamMemberWithRole | null>(null);
  const [updateRoleTarget, setUpdateRoleTarget] = useState<TeamMemberWithRole | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMemberWithRole | null>(null);

  const mutating = setMember.isPending || updateMember.isPending || deleteMember.isPending;

  const projectMemberIds = useMemo(() => new Set(teamMembers.map((m) => m.id)), [teamMembers]);

  const roles = useMemo(() => roleDefs.map((r) => r.name).sort(), [roleDefs]);
  const filteredMembers = useMemo(
    () =>
      teamMembers.filter((m) => {
        const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.roles.some((r) => r.toLowerCase().includes(search.toLowerCase()));
        const matchRole = filterRole === ALL || m.roles.includes(filterRole);
        return matchSearch && matchRole;
      }),
    [teamMembers, search, filterRole],
  );

  if (loadingMemberships || loadingGlobalMembers) return <PageLoader />;

  return (
    <div className='space-y-4'>
      <TeamStatsPanel members={teamMembers} />

      {/* Filter bar */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='flex items-center gap-2 flex-wrap'>
          <div className='relative'>
            <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Tìm thành viên...' className='pl-8 h-8 w-45 text-[12px]' />
          </div>
          {roles.length > 1 && (
            <Select value={filterRole} onValueChange={(v) => setFilterRole(v)}>
              <SelectTrigger className='h-8 text-[12px]'>
                <SelectValue placeholder='Tất cả vai trò' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả vai trò</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <ButtonGroup>
            {(['list', 'card'] as const).map((v) => (
              <Button key={v} variant={view === v ? 'default' : 'outline'} size='sm' onClick={() => setView(v)}>
                {v === 'list' ? 'Danh sách' : 'Thẻ'}
              </Button>
            ))}
          </ButtonGroup>
          <Button onClick={() => setShowAddModal(true)} disabled={mutating} className='gap-2 h-9'>
            <UserPlusIcon size={15} /> Thêm thành viên
          </Button>
        </div>
      </div>

      <p className='text-[12px] text-muted-foreground'>
        {filteredMembers.length} / {teamMembers.length} thành viên trong dự án
      </p>

      {view === 'list' ? (
        <div className='bg-card border border-border panel'>
          <TeamMembersTable members={filteredMembers} disabled={mutating} onView={setViewTarget} onUpdateRole={setUpdateRoleTarget} onDelete={setRemoveTarget} />
        </div>
      ) : (
        <MemberCardGrid members={filteredMembers} disabled={mutating} onView={setViewTarget} onUpdateRole={setUpdateRoleTarget} onDelete={setRemoveTarget} />
      )}

      <TeamMemberViewSheet open={!!viewTarget} member={viewTarget} onClose={() => setViewTarget(null)} onEdit={() => setViewTarget(null)} />

      <AddMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        globalMembers={globalMembers}
        projectMemberIds={projectMemberIds}
        roleDefs={roleDefs}
        onAdd={(memberId, roles) => {
          setMember.mutate({
            id: memberId,
            data: { memberId, roles, notes: '' },
          });
        }}
        adding={setMember.isPending}
      />

      <UpdateRoleModal
        open={!!updateRoleTarget}
        member={updateRoleTarget}
        roleDefs={roleDefs}
        onClose={() => setUpdateRoleTarget(null)}
        onSave={(memberId, roles) => updateMember.mutate({ id: memberId, data: { roles } }, { onSuccess: () => setUpdateRoleTarget(null) })}
        saving={updateMember.isPending}
      />

      {removeTarget && (
        <ConfirmDialog
          danger
          title='Xóa thành viên khỏi dự án'
          message={`Xóa "${removeTarget.name}" khỏi dự án? Thành viên vẫn tồn tại trong tổ chức.`}
          confirmLabel='Xóa khỏi dự án'
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => deleteMember.mutate(removeTarget.id, { onSuccess: () => setRemoveTarget(null) })}
        />
      )}
    </div>
  );
}
