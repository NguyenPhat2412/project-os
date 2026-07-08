'use client';
import { useState, useMemo } from 'react';
import { membersCollection } from '@/modules/team/collections/members';
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
  const { data: membersData, isLoading } = membersCollection.useList();
  const allMembers = (membersData ?? []) as TeamMember[];

  const createMember = membersCollection.useCreate();
  const updateMember = membersCollection.useUpdate();
  const deleteMember = membersCollection.useDelete();
  const mutating = createMember.isPending || updateMember.isPending || deleteMember.isPending;

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>(ALL);
  const [filterStatus, setFilterStatus] = useState<WorkloadStatus | typeof ALL>(ALL);
  const [view, setView] = useState<'list' | 'card'>('list');

  const [showAdd, setShowAdd] = useState(false);
  const [viewTarget, setViewTarget] = useState<TeamMember | null>(null);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [delTarget, setDelTarget] = useState<TeamMember | null>(null);
  const { data: freshViewData } = membersCollection.useDocument(viewTarget?.id ?? null, { staleTime: 0 });
  const { data: freshEditData } = membersCollection.useDocument(editTarget?.id ?? null, { staleTime: 0 });

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.roles.some((r) => r.toLowerCase().includes(search.toLowerCase()));
      const matchRole = filterRole === ALL || m.roles.includes(filterRole);
      const matchStatus = filterStatus === ALL || m.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [allMembers, search, filterRole, filterStatus]);

  const handleAdd = async (data: Omit<TeamMember, 'id'>) => {
    createMember.mutate({ ...data, order: Date.now() } as never, { onSuccess: () => setShowAdd(false) });
  };

  const handleEdit = async (data: Omit<TeamMember, 'id'>) => {
    if (!editTarget) return;
    updateMember.mutate({ id: editTarget.id, data: data as never }, { onSuccess: () => setEditTarget(null) });
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
      {delTarget && <ConfirmDialog danger title='Xoa nhan su' message={`Ban co chac muon xoa "${delTarget.name}" khoi to chuc? Hanh dong nay khong the hoan tac.`} confirmLabel='Xoa' onCancel={() => setDelTarget(null)} onConfirm={handleDelete} />}
    </div>
  );
}
