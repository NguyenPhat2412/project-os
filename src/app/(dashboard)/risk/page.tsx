/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { PageLoader } from '@/components/ui/page-loader';
import { Pagination } from '@/components/ui/pagination';
import { createCollectionListItem, useBatchFetch } from '@/lib/api-rq/hooks/useBatchFetch';
import { risksCollection } from '@/modules/risk/collections/risks';
import { RiskDialog } from '@/modules/risk/components/RiskDialog';
import { RiskFilterBar } from '@/modules/risk/components/RiskFilterBar';
import { RiskPageHeader } from '@/modules/risk/components/RiskPageHeader';
import { RiskStatsPanel } from '@/modules/risk/components/RiskStatsPanel';
import { RiskTable } from '@/modules/risk/components/RiskTable';
import { RiskViewSheet } from '@/modules/risk/components/RiskViewSheet';
import { membersCollection } from '@/modules/team/collections/members';
import { teamCollection } from '@/modules/team/collections/team';

import type { Risk, RiskLevel } from '@/modules/risk/types/risk';
import type { TeamMember } from '@/modules/team/types/team';

const ALL = 'all' as const;

export default function RiskPage() {
  const { data, isLoading, refetch: _refetch } = useBatchFetch([
    createCollectionListItem('risks', risksCollection),
    createCollectionListItem('teamMembers', teamCollection),
    createCollectionListItem('rootMembers', membersCollection),
  ]);

  const loading = isLoading;
  const rawRisks = (data.risks ?? []) as (Risk & { id: string })[];
  const projectMembers = (data.teamMembers ?? []) as unknown as { memberId: string; role: string }[];
  const rootMembers = (data.rootMembers ?? []) as TeamMember[];

  const teamMembers = useMemo((): TeamMember[] => {
    const map = new Map(rootMembers.map((m) => [m.id, m]));
    return projectMembers
      .map((pm) => map.get(pm.memberId))
      .filter((m): m is TeamMember => m !== undefined);
  }, [projectMembers, rootMembers]);

  const deleteRisk = risksCollection.useDelete();
  const updateRisk = risksCollection.useUpdate();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<RiskLevel | typeof ALL>(ALL);
  const [filterStatus, setFilterStatus] = useState<string | typeof ALL>(ALL);
  const [filterOwner, setFilterOwner] = useState<string | typeof ALL>(ALL);
  const [groupBy, setGroupBy] = useState('none');

  const [inlineUpdatingIds, setInlineUpdatingIds] = useState<Set<string>>(new Set());
  const [updatingColumn, setUpdatingColumn] = useState<string | null>(null);

  const handleUpdateRisk = useCallback(
    async (riskId: string, patch: Partial<Risk>, column: string) => {
      setInlineUpdatingIds((prev) => new Set(prev).add(riskId));
      setUpdatingColumn(column);
      try {
        await updateRisk.mutateAsync({ id: riskId, data: patch });
      } finally {
        setInlineUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(riskId);
          return next;
        });
        setUpdatingColumn(null);
      }
    },
    [updateRisk],
  );

  // ── Filtered risks ────────────────────────────────────────────────────────
  const filteredRisks = useMemo(() => {
    return rawRisks.filter((r) => {
      if (filterLevel !== ALL && r.level !== filterLevel) return false;
      if (filterStatus !== ALL && r.status !== filterStatus) return false;
      if (filterOwner !== ALL && r.ownerId !== filterOwner) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!r.description.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q) && !r.mitigation.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rawRisks, filterLevel, filterStatus, filterOwner, search]);

  // ── Client-side pagination ───────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [filterLevel, filterStatus, filterOwner, search]);

  const paginatedRisks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRisks.slice(start, start + PAGE_SIZE);
  }, [filteredRisks, page]);

  const totalPages = Math.ceil(filteredRisks.length / PAGE_SIZE);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<(Risk & { id: string }) | null>(null);
  const [viewRisk, setViewRisk] = useState<(Risk & { id: string }) | null>(null);
  const [deletingRisk, setDeletingRisk] = useState<(Risk & { id: string }) | null>(null);
  const { data: freshRiskData } = risksCollection.useDocument(viewRisk?.id ?? null, { staleTime: 0 });
  const { data: freshSelectedRiskData } = risksCollection.useDocument(selectedRisk?.id ?? null, { staleTime: 0 });

  const openCreate = () => {
    setSelectedRisk(null);
    setDialogOpen(true);
  };

  const openEdit = (risk: Risk & { id: string }) => {
    setViewRisk(null);
    setSelectedRisk(risk);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedRisk(null);
  };

  const nextId = useMemo(() => {
    const nums = rawRisks.map((r) => parseInt(r.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `R-${String(next).padStart(3, '0')}`;
  }, [rawRisks]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className='space-y-4'>
      {/* ── Page Header ── */}
      <RiskPageHeader onCreate={openCreate} />

      {/* ── Stats Panel ── */}
      <RiskStatsPanel risks={rawRisks} />

      {/* ── Filter bar ── */}
      <RiskFilterBar
        search={search}
        onSearchChange={setSearch}
        filterLevel={filterLevel}
        onLevelChange={setFilterLevel}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterOwner={filterOwner}
        onOwnerChange={setFilterOwner}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        teamMembers={teamMembers}
        onCreate={openCreate}
        filteredRisksCount={filteredRisks.length}
      />

      {/* ── Table ── */}
      <div className='bg-card border border-border panel p-5'>
        <RiskTable
          risks={groupBy !== 'none' ? filteredRisks : paginatedRisks}
          teamMembers={teamMembers}
          onEdit={openEdit}
          onDelete={setDeletingRisk}
          onView={(r) => setViewRisk(r)}
          onUpdate={handleUpdateRisk}
          inlineUpdatingIds={inlineUpdatingIds}
          updatingColumn={updatingColumn}
        />
        {groupBy === 'none' && <Pagination page={page} totalPages={totalPages} total={filteredRisks.length} limit={PAGE_SIZE} onPageChange={(p) => setPage(p)} />}
      </div>

      <RiskDialog open={dialogOpen} risk={(freshSelectedRiskData as (Risk & { id: string }) | null) ?? selectedRisk} nextId={nextId} teamMembers={teamMembers} onClose={handleClose} onSuccess={() => _refetch()} />

      <RiskViewSheet open={!!viewRisk} risk={(freshRiskData as (Risk & { id: string }) | null) ?? viewRisk} teamMembers={teamMembers} onClose={() => setViewRisk(null)} onEdit={() => viewRisk && openEdit(viewRisk)} />

      {deletingRisk && (
        <ConfirmDialog
          title='Xoá rủi ro'
          message={`Bạn có chắc muốn xoá rủi ro "${deletingRisk.description}"? Hành động này không thể hoàn tác.`}
          confirmLabel='Xoá rủi ro'
          danger
          onConfirm={async () => {
            await deleteRisk.mutateAsync(deletingRisk.id);
            if (viewRisk?.id === deletingRisk.id) setViewRisk(null);
            if (selectedRisk?.id === deletingRisk.id) {
              setSelectedRisk(null);
              setDialogOpen(false);
            }
            setDeletingRisk(null);
          }}
          onCancel={() => setDeletingRisk(null)}
        />
      )}
    </div>
  );
}
