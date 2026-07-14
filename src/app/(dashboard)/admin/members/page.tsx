'use client';
import { useState, useMemo } from 'react';
import { toTeamMember, useAdminUser, useAdminUsers, useCreateAdminUser, useDisableAdminUser, useUpdateAdminUser } from '@/lib/api/admin-users';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { PageLoader } from '@/components/ui/page-loader';
import { TeamStatsPanel } from '@/modules/team/components/TeamStatsPanel';
import { TeamMembersTable } from '@/modules/team/components/TeamMembersTable';
import { MemberCardGrid } from '@/modules/team/components/MemberCardGrid';
import { MemberFilterBar } from '@/modules/team/components/MemberFilterBar';
import { TeamMemberViewSheet } from '@/modules/team/components/TeamMemberViewSheet';
import { MemberModal } from '@/modules/team/components/MemberModal';
import { OverloadedWarning } from '@/modules/team/components/OverloadedWarning';
import { SimplePageHeader } from '@/components/layout/SimplePageHeader';
import { BREADCRUMBS } from '@/lib/breadcrumbs';
import type { TeamMember, WorkloadStatus } from '@/modules/team/types/team';

const ALL = 'all' as const;

export default function AdminMembersPage() {
  const { data: membersData, isLoading } = useAdminUsers();
  const allMembers = useMemo(() => (membersData ?? []).map(toTeamMember), [membersData]);

  const createMember = useCreateAdminUser();
  const updateMember = useUpdateAdminUser();
  const deleteMember = useDisableAdminUser();
  const mutating = createMember.isPending || updateMember.isPending || deleteMember.isPending;

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<WorkloadStatus | typeof ALL>(ALL);
  const [view, setView] = useState<'list' | 'card'>('list');

  const [showAdd, setShowAdd] = useState(false);
  const [viewTarget, setViewTarget] = useState<TeamMember | null>(null);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [delTarget, setDelTarget] = useState<TeamMember | null>(null);
  const { data: freshViewUser } = useAdminUser(viewTarget?.id ?? null);
  const { data: freshEditUser } = useAdminUser(editTarget?.id ?? null);
  const freshViewData = freshViewUser ? toTeamMember(freshViewUser) : null;
  const freshEditData = freshEditUser ? toTeamMember(freshEditUser) : null;

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.roles.some((r) => r.toLowerCase().includes(search.toLowerCase()));
      const matchRole = filterRole === ALL || m.roles.includes(filterRole);
      const matchStatus = filterStatus === ALL || m.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [allMembers, search, filterRole, filterStatus]);

  const handleAdd = async (data: Omit<TeamMember, 'id'> & { password?: string }) => {
    await createMember.mutateAsync({
      email: data.email,
      password: data.password ?? '',
      displayName: data.displayName ?? data.name,
      role: data.roles.includes('ROOT_ADMIN') ? 'ROOT_ADMIN' : 'USER',
    });
    setShowAdd(false);
  };

  const handleEdit = async (data: Omit<TeamMember, 'id'> & { password?: string }) => {
    if (!editTarget) return;
    await updateMember.mutateAsync({
      id: editTarget.id,
      data: {
        email: data.email,
        displayName: data.displayName ?? data.name,
        role: data.roles.includes('ROOT_ADMIN') ? 'ROOT_ADMIN' : 'USER',
        status: data.status === 'Vacant' ? 'DISABLED' : 'ACTIVE',
      },
    });
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!delTarget) return;
    deleteMember.mutate(delTarget.id, { onSuccess: () => setDelTarget(null) });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className='space-y-4'>
      <SimplePageHeader title='Members' summary={`${allMembers.length} thanh vien trong to chuc`} segments={BREADCRUMBS.adminMembers} />

      <TeamStatsPanel members={allMembers} />

      <MemberFilterBar
        search={search}
        onSearchChange={setSearch}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        view={view}
        onViewChange={setView}
        onCreate={() => setShowAdd(true)}
        members={allMembers}
        disabled={mutating}
      />

      {view === 'list' ? (
        <div className='bg-card border border-border panel'>
          <TeamMembersTable members={filteredMembers} disabled={mutating} onView={setViewTarget} onUpdateRole={setEditTarget} onDelete={setDelTarget} />
        </div>
      ) : (
        <MemberCardGrid members={filteredMembers} disabled={mutating} onView={setViewTarget} onUpdateRole={setEditTarget} onDelete={setDelTarget} />
      )}

      <OverloadedWarning members={allMembers} />

      <TeamMemberViewSheet
        open={!!viewTarget}
        member={(freshViewData as TeamMember | null) ?? viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => {
          if (viewTarget) {
            setEditTarget(viewTarget);
            setViewTarget(null);
          }
        }}
      />

      {showAdd && <MemberModal mode='add' onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editTarget && <MemberModal mode='edit' member={(freshEditData as TeamMember | null) ?? editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />}
      {delTarget && <ConfirmDialog danger title='Vô hiệu hóa tài khoản' message={`Vô hiệu hóa "${delTarget.name}"? Người dùng sẽ không thể đăng nhập; dữ liệu và lịch sử vẫn được giữ lại.`} confirmLabel='Vô hiệu hóa' onCancel={() => setDelTarget(null)} onConfirm={handleDelete} />}
    </div>
  );
}
