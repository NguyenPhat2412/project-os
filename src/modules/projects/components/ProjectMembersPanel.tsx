'use client';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { getRootDirectoryPage, projectDirectoryCollection } from '@/modules/team/collections/members';
import { roleDefinitionsCollection } from '@/modules/project-roles/collections/role-definitions';
import { apiClient } from '@/lib/api/client';
import { useWorkloadReadModel } from '@/lib/api/read-models';
import { useWorkspace } from '@/lib/api/workspace';
import { usePermission } from '@/hooks/usePermission';
import { useEmployees, useOrganizationMembers, type Employee } from '@/lib/api/organizations';
import { getStatusFromWorkload } from '@/modules/team/types/team';
import type { Member, TeamMemberWithRole, ProjectTeamMember } from '@/modules/team/types/team';
import type { RoleDefinition } from '@/modules/project-roles/types/role-definition';

const ALL = 'all' as const;

interface Props {
  projectId: string;
  organizationId?: string;
}

function withEmployeeProfile(member: Member, employee?: Employee): Member {
  if (!employee) return { ...member, title: member.title ?? 'Chưa gán hồ sơ nhân sự' };
  const name = employee.fullName.trim() || member.name;
  return {
    ...member,
    name,
    displayName: name,
    email: employee.email || member.email,
    title: employee.title?.trim() || 'Chưa cập nhật chức danh',
  };
}

export function ProjectMembersPanel({ projectId, organizationId }: Props) {
  const queryClient = useQueryClient();
  const { data: workspace } = useWorkspace();
  const { isRootAdmin } = usePermission();
  // Workspace ownership is available before the legacy root-role store settles.
  // The API remains the authorization boundary for the global directory.
  const rootAdmin = isRootAdmin() || workspace?.systemRole === 'PLATFORM_ADMIN';
  const organizationScope = organizationId ?? workspace?.organization.id ?? null;
  const projectMembersCol = projectMembersCollection(projectId);
  const projectDirectory = useMemo(() => projectDirectoryCollection(projectId), [projectId]);
  const { data: projectMemberships, isLoading: loadingMemberships } = projectMembersCol.useList() as { data: (ProjectTeamMember & { id: string })[]; isLoading: boolean };
  const { data: globalMembersData, isLoading: loadingGlobalMembers } = projectDirectory.useList();
  const organizationMembers = useOrganizationMembers(organizationScope);
  const organizationEmployees = useEmployees(organizationScope);
  const { data: roleDefsData } = roleDefinitionsCollection(projectId).useList();
  const { data: workloadData, isLoading: loadingWorkload } = useWorkloadReadModel();

  const setMember = projectMembersCol.useSet();
  const updateMember = projectMembersCol.useUpdate();
  const deleteMember = projectMembersCol.useDelete();

  const employeeByUserId = useMemo(
    () => new Map((organizationEmployees.data ?? [])
      .filter((employee) => employee.userId)
      .map((employee) => [employee.userId!, employee])),
    [organizationEmployees.data],
  );
  const globalMembers = useMemo(
    () => ((globalMembersData ?? []) as Member[]).map((member) => withEmployeeProfile(member, employeeByUserId.get(member.id))),
    [employeeByUserId, globalMembersData],
  );
  const candidateMembers = useMemo(() => {
    if (rootAdmin) return [];
    const current = new Map(globalMembers.map((member) => [member.id, member]));
    return (organizationMembers.data ?? [])
      .filter((membership) => membership.status === 'active')
      .map((membership) => {
        const member = current.get(membership.userId);
        if (member) return member;
        const employee = employeeByUserId.get(membership.userId);
        const name = employee?.fullName || employee?.email || 'Chưa cập nhật tên';
        return {
          id: membership.userId,
          name,
          displayName: name,
          email: employee?.email ?? 'Chưa cập nhật email',
          title: employee?.title ?? 'Chưa gán hồ sơ nhân sự',
          initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
          gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)',
          roles: [membership.role],
          status: 'Active',
        } as Member;
      });
  }, [employeeByUserId, globalMembers, organizationMembers.data, rootAdmin]);
  const organizationMembershipByUserId = useMemo(
    () => new Map((organizationMembers.data ?? []).map((membership) => [membership.userId, membership])),
    [organizationMembers.data],
  );
  const roleDefs = useMemo(() => (roleDefsData ?? []) as RoleDefinition[], [roleDefsData]);
  const workloadMap = useMemo(() => new Map((workloadData?.workload ?? []).map((row) => [row.assigneeId, row])), [workloadData]);

  // Build lookup map from root member id → member data
  const memberMap = useMemo(() => new Map(globalMembers.map((member) => [member.id, member])), [globalMembers]);

  const teamMembers = useMemo((): TeamMemberWithRole[] => {
    return ((projectMemberships ?? []) as (ProjectTeamMember & { id: string })[])
      .map((pm) => {
        const root = memberMap.get(pm.memberId);
        if (!root) return null;
        const row = workloadMap.get(pm.memberId);
        const taskCount = row?.tasks ?? 0;
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
  }, [projectMemberships, memberMap, workloadMap]);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>(ALL);
  const [view, setView] = useState<'list' | 'card'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<TeamMemberWithRole | null>(null);
  const [updateRoleTarget, setUpdateRoleTarget] = useState<TeamMemberWithRole | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMemberWithRole | null>(null);
  const [addingMember, setAddingMember] = useState(false);

  const mutating = addingMember || setMember.isPending || updateMember.isPending || deleteMember.isPending;

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

  const handleAddMember = async (memberId: string, roles: string[]) => {
    setAddingMember(true);
    try {
      const membership = organizationMembershipByUserId.get(memberId);
      if (organizationScope && membership?.status !== 'active') {
        await apiClient.put(`organizations/${organizationScope}/members`, {
          userId: memberId,
          role: membership?.role ?? 'MEMBER',
          status: 'active',
        });
      }
      await setMember.mutateAsync({ id: memberId, data: { memberId, roles, notes: '' } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectDirectory.keys.lists() }),
        queryClient.invalidateQueries({ queryKey: ['organizations', 'members', organizationScope] }),
      ]);
    } finally {
      setAddingMember(false);
    }
  };

  const loadRootDirectoryPage = useCallback(async (page: number, search: string) => {
    const directory = await getRootDirectoryPage(page, search);
    return { ...directory, data: directory.data.map((member) => withEmployeeProfile(member, employeeByUserId.get(member.id))) };
  }, [employeeByUserId]);

  if (loadingMemberships || loadingGlobalMembers || loadingWorkload || organizationEmployees.isLoading) return <PageLoader />;

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
        Đang hiển thị {filteredMembers.length} trong tổng số {teamMembers.length} thành viên dự án
      </p>

      {rootAdmin && showAddModal && (
        <p className='text-[12px] text-muted-foreground'>
          Tài khoản chưa thuộc tổ chức sẽ tự được thêm với vai trò Thành viên khi thêm vào dự án.
        </p>
      )}

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
        globalMembers={candidateMembers}
        projectMemberIds={projectMemberIds}
        roleDefs={roleDefs}
        onAdd={handleAddMember}
        adding={addingMember}
        directoryLabel={rootAdmin ? 'Tất cả tài khoản đang hoạt động' : 'Nhân sự trong tổ chức'}
        loadDirectoryPage={rootAdmin ? loadRootDirectoryPage : undefined}
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
