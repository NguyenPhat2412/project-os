'use client';
import { useState, useMemo, use } from 'react';
import { SearchIcon, ShieldIcon } from 'lucide-react';
import { createSubcollection } from '@/lib/api-rq';
import { projectRolesCollection } from '@/modules/project-roles/collections/project-roles';
import { membersCollection } from '@/modules/team/collections/members';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { PageLoader } from '@/components/ui/page-loader';
import { Avatar } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/shared/stat-card';
import type { ProjectRole } from '@/modules/project-roles/types/project-role';
import type { TeamMember, ProjectTeamMember } from '@/modules/team/types/team';
import type { WithId } from '@/lib/api-rq';

const AVAILABLE_PROJECT_ROLES = [
  { name: 'Project Admin', description: 'Quản trị dự án', immutable: false },
  { name: 'Developer', description: 'Phát triển viên', immutable: false },
  { name: 'QA', description: 'QA Engineer', immutable: false },
  { name: 'Viewer', description: 'Chỉ xem', immutable: false },
];

export default function ProjectRolesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  const projectId = resolved.id;

  const teamCol = createSubcollection<ProjectTeamMember>({
    path: (pid: string) => `projects/${pid}/members`,
    transform: (raw): WithId<ProjectTeamMember> => {
      const data = raw as unknown as ProjectTeamMember;
      return { id: data.memberId, ...data } as WithId<ProjectTeamMember>;
    },
  })(projectId);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [grantTarget, setGrantTarget] = useState<{ member: ProjectRole; role: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ member: ProjectRole; role: string } | null>(null);
  const [addTarget, setAddTarget] = useState<{ member: TeamMember; role: string } | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [selectedRoleToGrant, setSelectedRoleToGrant] = useState<string>('');

  const collection = projectRolesCollection(projectId);
  const { data: projectRolesData, isLoading: rolesLoading } = collection.useList();
  const projectRoles = useMemo(() => (projectRolesData ?? []) as ProjectRole[], [projectRolesData]);

  const { data: globalMembersData, isLoading: membersLoading } = membersCollection.useList();
  const globalMembers = useMemo(() => (globalMembersData ?? []) as TeamMember[], [globalMembersData]);

  const { data: teamMembersData } = teamCol.useList();
  const projectTeamMembers = useMemo(
    () => (teamMembersData ?? []) as (ProjectTeamMember & { id: string })[],
    [teamMembersData],
  );

  const setProjectRole = collection.useSet();
  const updateProjectRole = collection.useUpdate();

  const projectRolesWithInfo = useMemo(() => {
    return projectRoles.map((pr) => {
      const global = globalMembers.find((m) => m.id === pr.uid || m.email === pr.email);
      return {
        ...pr,
        name: pr.displayName ?? global?.name ?? pr.email,
        initials: global?.initials ?? pr.email?.slice(0, 2).toUpperCase() ?? '??',
        gradient: global?.gradient,
      };
    });
  }, [projectRoles, globalMembers]);

  const availableToAdd = useMemo(() => {
    const projectMemberIds = new Set(projectTeamMembers.map((m) => m.id));
    const existingUids = new Set(projectRoles.map((r) => r.uid));
    return globalMembers.filter((m) => projectMemberIds.has(m.id) && !existingUids.has(m.id));
  }, [globalMembers, projectTeamMembers, projectRoles]);

  const filtered = useMemo(() => {
    return projectRolesWithInfo.filter((m) => {
      const matchSearch = !search || m.email.toLowerCase().includes(search.toLowerCase()) || (m.name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || m.roles.includes(roleFilter);
      return matchSearch && matchRole;
    });
  }, [projectRolesWithInfo, search, roleFilter]);

  const confirmGrantRole = () => {
    if (!grantTarget) return;
    if (grantTarget.member.roles.includes(grantTarget.role)) {
      setGrantTarget(null);
      return;
    }
    updateProjectRole.mutate({ id: grantTarget.member.memberId, data: { roles: [...grantTarget.member.roles, grantTarget.role] } }, { onSuccess: () => setGrantTarget(null) });
  };

  const confirmRevokeRole = () => {
    if (!revokeTarget) return;
    const newRoles = revokeTarget.member.roles.filter((r) => r !== revokeTarget.role);
    updateProjectRole.mutate({ id: revokeTarget.member.memberId, data: { roles: newRoles } }, { onSuccess: () => setRevokeTarget(null) });
  };

  const confirmAddMember = () => {
    if (!addTarget) return;
    setProjectRole.mutate(
      {
        id: addTarget.member.id,
        data: {
          uid: addTarget.member.id,
          memberId: addTarget.member.id,
          email: addTarget.member.email,
          displayName: addTarget.member.name,
          roles: addTarget.role ? [addTarget.role] : [],
          projectId,
        },
      },
      {
        onSuccess: () => {
          setAddTarget(null);
          setShowAddPicker(false);
        },
      },
    );
  };

  if (rolesLoading || membersLoading) return <PageLoader />;

  const projectAdminCount = projectRolesWithInfo.filter((m) => m.roles.includes('Project Admin')).length;

  return (
    <div className='space-y-5'>
      <SimplePageHeader
        title={`Vai trò — Project ${projectId}`}
        summary='Phân quyền RBAC cho thành viên trong dự án'
        segments={BREADCRUMBS.adminProjectRoles(projectId)}
        actions={
          <Button size='sm' onClick={() => setShowAddPicker(true)} className='gap-1.5'>
            <ShieldIcon size={13} /> Thêm thành viên
          </Button>
        }
      />

      <div className='grid grid-cols-3 gap-3'>
        <StatCard label='Thành viên có Roles' value={projectRoles.length} color='accent' />
        <StatCard label='Project Admins' value={projectAdminCount} color='green' />
        <StatCard label='Available Roles' value={AVAILABLE_PROJECT_ROLES.length} color='purple' />
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative flex-1 max-w-80'>
          <SearchIcon size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Tìm email, tên...' className='pl-8 h-8 text-[12px]' />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
          <SelectTrigger className='h-8 text-[12px]'>
            <SelectValue placeholder='Tất cả roles' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả roles</SelectItem>
            {AVAILABLE_PROJECT_ROLES.map((r) => (
              <SelectItem key={r.name} value={r.name}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showAddPicker && (
        <div className='bg-card border border-border panel divide-y divide-border'>
          <div className='px-4 py-3 flex items-center justify-between'>
            <p className='text-[13px] font-medium'>Thêm thành viên vào Project Roles</p>
            <Button size='sm' variant='ghost' onClick={() => setShowAddPicker(false)}>
              Đóng
            </Button>
          </div>
          {availableToAdd.length === 0 ? (
            <p className='px-4 py-6 text-[13px] text-muted-foreground text-center'>Không có thành viên nào trong dự án để thêm.</p>
          ) : (
            <div className='max-h-60 overflow-y-auto'>
              {availableToAdd.map((m) => (
                <div key={m.id} className='flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors'>
                  <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-[13px] font-medium truncate'>{m.name}</p>
                    <p className='text-[11px] text-muted-foreground truncate'>{m.email}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Select value={selectedRoleToGrant} onValueChange={(v) => setSelectedRoleToGrant(v)}>
                      <SelectTrigger className='h-6 text-[11px]'>
                        <SelectValue placeholder='Chọn role' />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_PROJECT_ROLES.map((r) => (
                          <SelectItem key={r.name} value={r.name}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size='sm' variant='outline' onClick={() => setAddTarget({ member: m, role: selectedRoleToGrant })} disabled={!selectedRoleToGrant}>
                      Thêm
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className='bg-card border border-border panel overflow-hidden'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-border'>
              <th className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] px-3 py-2.5 text-left'>Thành viên</th>
              <th className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] px-3 py-2.5 text-left'>Roles</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={2} className='px-4 py-8 text-center text-[13px] text-muted-foreground'>
                  Không có dữ liệu.
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.memberId} className='hover:bg-secondary/50 transition-colors'>
                  <td className='px-3 py-3'>
                    <div className='flex items-center gap-2.5'>
                      <Avatar initials={member.initials} gradient={member.gradient} size='sm' />
                      <div>
                        <p className='text-[13px] font-medium'>{member.displayName ?? member.name}</p>
                        <p className='text-[11px] text-muted-foreground'>{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-3 py-3'>
                    <div className='flex flex-wrap gap-1.5'>
                      {member.roles.length === 0 ? (
                        <span className='text-[11px] text-muted-foreground italic'>Chưa có vai trò</span>
                      ) : (
                        member.roles.map((role) => (
                          <span key={role} className='inline-flex items-center gap-1'>
                            <Badge variant='outline' className='text-[11px] gap-1'>
                              {role}
                            </Badge>
                            <button onClick={() => setRevokeTarget({ member, role })} className='text-muted-foreground hover:text-red-500 transition-colors text-[11px] leading-none' title='Thu hồi vai trò'>
                              ×
                            </button>
                          </span>
                        ))
                      )}
                      {AVAILABLE_PROJECT_ROLES.filter((r) => !member.roles.includes(r.name)).length > 0 && (
                        <Select
                          onValueChange={(v) => {
                            if (v) setGrantTarget({ member, role: v });
                          }}
                        >
                          <SelectTrigger className='h-5 text-[11px] text-muted-foreground'>
                            <SelectValue placeholder='+ Thêm role' />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_PROJECT_ROLES.filter((r) => !member.roles.includes(r.name)).map((r) => (
                              <SelectItem key={r.name} value={r.name}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {grantTarget && (
        <ConfirmDialog title='Gán vai trò' message={`Gán vai trò "${grantTarget.role}" cho "${grantTarget.member.displayName ?? grantTarget.member.email}"?`} confirmLabel='Gán' onCancel={() => setGrantTarget(null)} onConfirm={confirmGrantRole} />
      )}

      {revokeTarget && (
        <ConfirmDialog
          danger
          title='Thu hồi vai trò'
          message={`Thu hồi vai trò "${revokeTarget.role}" khỏi "${revokeTarget.member.displayName ?? revokeTarget.member.email}"?`}
          confirmLabel='Thu hồi'
          onCancel={() => setRevokeTarget(null)}
          onConfirm={confirmRevokeRole}
        />
      )}

      {addTarget && <ConfirmDialog title='Thêm vào Project Roles' message={`Thêm "${addTarget.member.name}" với vai trò "${addTarget.role}"?`} confirmLabel='Thêm' onCancel={() => setAddTarget(null)} onConfirm={confirmAddMember} />}
    </div>
  );
}
