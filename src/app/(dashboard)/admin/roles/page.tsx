'use client';
import { useState, useMemo } from 'react';
import { ShieldCheckIcon, SearchIcon, UserIcon } from 'lucide-react';
import { rootMembersCollection } from '@/modules/root/collections/root-members';
import { membersCollection } from '@/modules/team/collections/members';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import { usePermission, ROOT_ADMIN_ROLE, ADMIN_EMAILS } from '@/hooks/usePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { PageLoader } from '@/components/ui/page-loader';
import { Avatar } from '@/components/ui/avatar';
import { StatCard } from '@/components/ui/shared/stat-card';
import { cn } from '@/lib/utils';
import type { RootMember } from '@/modules/root/types/root-member';
import type { TeamMember } from '@/modules/team/types/team';

// Predefined root roles (Administrators is immutable)
const AVAILABLE_ROOT_ROLES = [
  { name: 'Administrators', description: 'Toàn quyền quản trị hệ thống', immutable: true },
  { name: 'Project Manager', description: 'Quản lý dự án', immutable: false },
  { name: 'Developer', description: 'Phát triển viên', immutable: false },
  { name: 'Viewer', description: 'Chỉ xem', immutable: false },
];

export default function AdminRolesPage() {
  const { isRootAdmin } = usePermission();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [addTarget, setAddTarget] = useState<TeamMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RootMember | null>(null);
  const [grantTarget, setGrantTarget] = useState<{ member: RootMember; role: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ member: RootMember; role: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Fetch root members
  const { data: rootMembersData, isLoading: rootLoading } = rootMembersCollection.useList();
  const rootMembers = (rootMembersData ?? []) as RootMember[];

  // Fetch all global members (for adding new root members)
  const { data: globalMembersData, isLoading: globalLoading } = membersCollection.useList();
  const globalMembers = (globalMembersData ?? []) as TeamMember[];

  // Mutations
  const addRootMember = rootMembersCollection.useSet();
  const updateRootMember = rootMembersCollection.useUpdate();
  const deleteRootMember = rootMembersCollection.useDelete();

  const mutating = addRootMember.isPending || updateRootMember.isPending || deleteRootMember.isPending;

  // Merge global member info into root members
  const rootMembersWithInfo = useMemo(() => {
    return rootMembers.map((rm) => {
      const global = globalMembers.find((m) => m.email === rm.email);
      return {
        ...rm,
        name: rm.displayName ?? global?.name ?? rm.email,
        photoURL: rm.photoURL ?? global?.gradient,
        initials: global?.initials ?? rm.email?.slice(0, 2).toUpperCase() ?? '??',
      };
    });
  }, [rootMembers, globalMembers]);

  // Members NOT yet in members (can be added)
  const availableToAdd = useMemo(() => {
    const rootEmails = new Set(rootMembers.map((r) => r.email));
    return globalMembers.filter((m) => !rootEmails.has(m.email));
  }, [globalMembers, rootMembers]);

  // Filter
  const filtered = useMemo(() => {
    return rootMembersWithInfo.filter((m) => {
      const matchSearch = !search || m.email.toLowerCase().includes(search.toLowerCase()) || (m.displayName ?? '').toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || m.roles.includes(roleFilter);
      return matchSearch && matchRole;
    });
  }, [rootMembersWithInfo, search, roleFilter]);

  // Handlers
  const handleAddMember = (member: TeamMember) => {
    setAddTarget(member);
  };

  const confirmAddMember = () => {
    if (!addTarget) return;
    addRootMember.mutate(
      {
        id: addTarget.id,
        data: {
          uid: addTarget.id,
          email: addTarget.email,
          displayName: addTarget.name,
          photoURL: undefined,
          roles: [],
        },
      },
      { onSuccess: () => setAddTarget(null) },
    );
  };

  const confirmGrantRole = () => {
    if (!grantTarget) return;
    const currentRoles = grantTarget.member.roles;
    if (currentRoles.includes(grantTarget.role)) {
      setGrantTarget(null);
      return;
    }
    updateRootMember.mutate(
      {
        id: grantTarget.member.uid,
        data: { roles: [...currentRoles, grantTarget.role] },
      },
      { onSuccess: () => setGrantTarget(null) },
    );
  };

  const confirmRevokeRole = () => {
    if (!revokeTarget) return;
    // Cannot revoke Administrators
    if (revokeTarget.role === ROOT_ADMIN_ROLE) {
      setRevokeTarget(null);
      return;
    }
    const newRoles = revokeTarget.member.roles.filter((r) => r !== revokeTarget.role);
    updateRootMember.mutate(
      {
        id: revokeTarget.member.uid,
        data: { roles: newRoles },
      },
      { onSuccess: () => setRevokeTarget(null) },
    );
  };

  const confirmRemoveMember = () => {
    if (!removeTarget) return;
    deleteRootMember.mutate(removeTarget.uid, { onSuccess: () => setRemoveTarget(null) });
  };

  if (rootLoading || globalLoading) return <PageLoader />;

  const adminCount = rootMembersWithInfo.filter((m) => m.roles.includes(ROOT_ADMIN_ROLE)).length;

  return (
    <div className='space-y-5'>
      <SimplePageHeader
        title='Vai trò Root (RBAC)'
        summary='Phân quyền root cho người dùng toàn hệ thống'
        segments={BREADCRUMBS.adminRoles}
        actions={
          <Button size='sm' onClick={() => setSelectedRole('add-member')} className='gap-1.5'>
            <UserIcon size={13} /> Thêm người dùng Root
          </Button>
        }
      />

      {/* Stats */}
      <div className='grid grid-cols-3 gap-3'>
        <StatCard label='Tổng Users Root' value={rootMembers.length} color='accent' />
        <StatCard label='Administrators' value={adminCount} color='red' />
        <StatCard label='Available Roles' value={AVAILABLE_ROOT_ROLES.length} color='purple' />
      </div>

      {/* Filter bar */}
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
            {AVAILABLE_ROOT_ROLES.map((r) => (
              <SelectItem key={r.name} value={r.name}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add member modal */}
      {selectedRole === 'add-member' && (
        <div className='bg-card border border-border panel divide-y divide-border'>
          <div className='px-4 py-3 flex items-center justify-between'>
            <p className='text-[13px] font-medium'>Thêm người dùng Root</p>
            <Button size='sm' variant='ghost' onClick={() => setSelectedRole('')}>
              Đóng
            </Button>
          </div>
          {availableToAdd.length === 0 ? (
            <p className='px-4 py-6 text-[13px] text-muted-foreground text-center'>Tất cả người dùng đã là Root Members.</p>
          ) : (
            <div className='max-h-60 overflow-y-auto'>
              {availableToAdd.map((m) => (
                <div key={m.id} className='flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors'>
                  <Avatar initials={m.initials} gradient={m.gradient} size='sm' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-[13px] font-medium truncate'>{m.name}</p>
                    <p className='text-[11px] text-muted-foreground truncate'>{m.email}</p>
                  </div>
                  <Button size='sm' variant='outline' onClick={() => handleAddMember(m)}>
                    Thêm
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className='bg-card border border-border panel overflow-hidden'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-border'>
              <th className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] px-3 py-2.5 text-left'>Người dùng</th>
              <th className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] px-3 py-2.5 text-left'>Roles</th>
              <th className='font-mono-dm text-[12px] text-muted-foreground uppercase tracking-[1.5px] px-3 py-2.5 text-left w-20'>Thao tác</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className='px-4 py-8 text-center text-[13px] text-muted-foreground'>
                  Không có người dùng nào.
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.uid} className='hover:bg-secondary/50 transition-colors'>
                  <td className='px-3 py-3'>
                    <div className='flex items-center gap-2.5'>
                      <Avatar initials={member.initials} gradient={member.photoURL} size='sm' />
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
                        member.roles.map((role) => {
                          const roleDef = AVAILABLE_ROOT_ROLES.find((r) => r.name === role);
                          return (
                            <span key={role} className='inline-flex items-center gap-1'>
                              <Badge variant={role === ROOT_ADMIN_ROLE ? 'destructive' : 'outline'} className='text-[11px] gap-1'>
                                {role === ROOT_ADMIN_ROLE && <ShieldCheckIcon size={9} />}
                                {role}
                              </Badge>
                              {role !== ROOT_ADMIN_ROLE && (
                                <button onClick={() => setRevokeTarget({ member, role })} className='text-muted-foreground hover:text-red-500 transition-colors text-[11px] leading-none' title='Thu hồi vai trò'>
                                  ×
                                </button>
                              )}
                            </span>
                          );
                        })
                      )}
                      {/* Add role button */}
                      {AVAILABLE_ROOT_ROLES.filter((r) => !member.roles.includes(r.name)).length > 0 && (
                        <Select
                          onValueChange={(v) => {
                            if (v) setGrantTarget({ member, role: v });
                          }}
                        >
                          <SelectTrigger className='h-5 text-[11px] text-muted-foreground'>
                            <SelectValue placeholder='+ Thêm role' />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_ROOT_ROLES.filter((r) => !member.roles.includes(r.name)).map((r) => (
                              <SelectItem key={r.name} value={r.name}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>
                  <td className='px-3 py-3'>
                    {member.email != null && !ADMIN_EMAILS.includes(member.email) && (
                      <Button size='sm' variant='ghost' className='text-[12px] text-red-500 hover:text-red-500 hover:bg-red-500/10 h-7 px-2' onClick={() => setRemoveTarget(member)}>
                        Xóa
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm: Add root member */}
      {addTarget && <ConfirmDialog title='Thêm Root Member' message={`Thêm "${addTarget.name}" (${addTarget.email}) làm Root Member?`} confirmLabel='Thêm' onCancel={() => setAddTarget(null)} onConfirm={confirmAddMember} />}

      {/* Confirm: Grant role */}
      {grantTarget && (
        <ConfirmDialog title='Gán vai trò' message={`Gán vai trò "${grantTarget.role}" cho "${grantTarget.member.displayName ?? grantTarget.member.email}"?`} confirmLabel='Gán' onCancel={() => setGrantTarget(null)} onConfirm={confirmGrantRole} />
      )}

      {/* Confirm: Revoke role */}
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

      {/* Confirm: Remove member */}
      {removeTarget && (
        <ConfirmDialog
          danger
          title='Xóa Root Member'
          message={`Xóa "${removeTarget.displayName ?? removeTarget.email}" khỏi danh sách Root Members? Roles sẽ bị xóa.`}
          confirmLabel='Xóa'
          onCancel={() => setRemoveTarget(null)}
          onConfirm={confirmRemoveMember}
        />
      )}
    </div>
  );
}
