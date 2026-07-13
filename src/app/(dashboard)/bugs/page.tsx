'use client';

import { useCallback, useMemo, useState } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { bugColumnsCollection } from '@/modules/bugs/collections/bugColumns';
import { teamCollection } from '@/modules/team/collections/team';
import { membersCollection } from '@/modules/team/collections/members';
import { sprintsCollection } from '@/modules/sprint/collections/sprint';
import { useBatchFetch, createCollectionListItem } from '@/lib/api-rq/hooks/useBatchFetch';
import { BugStatsPanel } from '@/modules/bugs/components/BugStatsPanel';
import { BugTable } from '@/modules/bugs/components/BugTable';
import { BugDialog } from '@/modules/bugs/components/BugDialog';
import { BugViewSheet } from '@/modules/bugs/components/BugViewSheet';
import { BugPageHeader } from '@/modules/bugs/components/BugPageHeader';
import { BugFilterBar } from '@/modules/bugs/components/BugFilterBar';
import { PageLoader } from '@/components/ui/page-loader';
import { KanbanView } from '@/components/ui/shared/kaban-view';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { BUG_COLUMNS } from '@/modules/bugs/types/bug';
import type { Bug, BugColumn, BugStatus } from '@/modules/bugs/types/bug';
import type { TeamMember, TeamMemberWithRole, ProjectTeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';

type BugWithId = Bug & { id: string };
type ViewMode = 'list' | 'kanban';

export default function BugsPage() {
  const { data: rawBugs = [], isLoading } = bugsCollection.useList();
  const bugs = rawBugs as BugWithId[];
  const deleteBug = bugsCollection.useDelete();
  const updateBug = bugsCollection.useUpdate();
  const [inlineUpdatingIds, setInlineUpdatingIds] = useState<Set<string>>(new Set());
  const [updatingColumn, setUpdatingColumn] = useState<string | null>(null);

  const handleUpdateBug = useCallback(
    async (bugId: string, patch: Partial<Bug>, column: string) => {
      setInlineUpdatingIds((prev) => new Set(prev).add(bugId));
      setUpdatingColumn(column);
      try {
        await updateBug.mutateAsync({ id: bugId, data: patch });
      } finally {
        setInlineUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(bugId);
          return next;
        });
        setUpdatingColumn(null);
      }
    },
    [updateBug],
  );

  const { data: batchData } = useBatchFetch([
    createCollectionListItem('teamMembers', teamCollection),
    createCollectionListItem('rootMembers', membersCollection),
    createCollectionListItem('bugColumns', bugColumnsCollection),
    createCollectionListItem('sprints', sprintsCollection),
  ]);
  const projectMemberEntries = useMemo(
    () => (batchData.teamMembers ?? []) as unknown as (ProjectTeamMember & { id: string })[],
    [batchData.teamMembers],
  );
  const rootMembers = useMemo(() => (batchData.rootMembers ?? []) as TeamMember[], [batchData.rootMembers]);
  const teamMembers = useMemo((): TeamMemberWithRole[] => {
    const map = new Map(rootMembers.map((m) => [m.id, m]));
    return projectMemberEntries
      .map((pm) => {
        const root = map.get(pm.id);
        if (!root) return null;
        return { ...root, roles: pm.roles } as TeamMemberWithRole;
      })
      .filter((m): m is TeamMemberWithRole => m !== null);
  }, [projectMemberEntries, rootMembers]);
  const bugColumnsAPI = (batchData.bugColumns ?? []) as BugColumn[];
  const bugColumns = bugColumnsAPI.length > 0 ? bugColumnsAPI : BUG_COLUMNS;
  const sprints = ((batchData.sprints ?? []) as (Sprint & { id: string })[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const [view, setView] = useState<ViewMode>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugWithId | null>(null);
  const [viewBug, setViewBug] = useState<BugWithId | null>(null);
  const [deletingBug, setDeletingBug] = useState<BugWithId | null>(null);
  const { data: freshBugData } = bugsCollection.useDocument(viewBug?.id ?? null, { staleTime: 0 });
  const { data: freshSelectedBugData } = bugsCollection.useDocument(selectedBug?.id ?? null, { staleTime: 0 });
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSprint, setFilterSprint] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const openCreate = () => {
    setSelectedBug(null);
    setDialogOpen(true);
  };
  const openEdit = (bug: BugWithId) => {
    setViewBug(null);
    setSelectedBug(bug);
    setDialogOpen(true);
  };

  const nextId = (() => {
    const nums = bugs.map((b) => parseInt(b.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `BUG-${String(next).padStart(2, '0')}`;
  })();

  const filteredBugs = useMemo(
    () =>
      bugs.filter((b) => {
        if (filterSeverity !== 'all' && b.severity !== filterSeverity) return false;
        if (filterStatus !== 'all' && b.status !== filterStatus) return false;
        if (filterSprint !== 'all') {
          if (filterSprint === 'none') {
            if (b.sprintId) return false;
          } else {
            if (b.sprintId !== filterSprint) return false;
          }
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          if (!b.title.toLowerCase().includes(q) && !b.id.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [bugs, filterSeverity, filterStatus, filterSprint, search],
  );

  const paginatedBugs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredBugs.slice(start, start + PAGE_SIZE);
  }, [filteredBugs, page]);

  const totalPages = Math.ceil(filteredBugs.length / PAGE_SIZE);

  const handleMoveBug = async (bugId: string, toStatus: BugStatus) => {
    const bug = bugs.find((b) => b.id === bugId);
    if (!bug || bug.status === toStatus) return;
    const updates: Record<string, unknown> = { status: toStatus };
    if (toStatus === 'fixed' && !bug.resolvedAt) {
      updates.resolvedAt = new Date().toISOString().slice(0, 10);
    }
    await bugsCollection.helpers.update(bugId, updates as Parameters<typeof bugsCollection.helpers.update>[1]);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* ── Header ── */}
      <BugPageHeader totalBugs={bugs.length} openBugs={bugs.filter((b) => b.status === 'open').length} />

      {/* ── Stats panel ── */}
      <BugStatsPanel bugs={bugs} />

      {/* ── Filter bar ── */}
      <div className='mb-4'>
        <BugFilterBar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          filterSeverity={filterSeverity}
          onSeverityChange={(value) => { setFilterSeverity(value); setPage(1); }}
          filterStatus={filterStatus}
          onStatusChange={(value) => { setFilterStatus(value); setPage(1); }}
          filterSprint={filterSprint}
          onSprintChange={(value) => { setFilterSprint(value); setPage(1); }}
          columns={bugColumns}
          sprints={sprints}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          filteredBugsCount={filteredBugs.length}
          view={view}
          onViewChange={setView}
          onCreate={openCreate}
        />
      </div>

      {/* ── Content ── */}
      {view === 'kanban' ? (
        <KanbanView<BugWithId>
          columns={bugColumns}
          items={filteredBugs}
          statusField='status'
          itemMapper={(bug) => {
            const member = teamMembers.find((m) => m.id === bug.assigneeId);
            return {
              tag: bug.id,
              category: bug.severity,
              title: bug.title,
              priority: bug.severity === 'Critical' || bug.severity === 'High' ? 'High' : bug.severity === 'Medium' ? 'Normal' : 'Low',
              assigneeInitials: member?.initials,
              assigneeColor: member?.gradient,
              assigneePhotoURL: member?.photoURL,
              faded: bug.status === 'fixed' || bug.status === 'wont-fix',
            };
          }}
          onItemClick={openEdit}
          onMoveItem={async (bugId, toStatus) => {
            await handleMoveBug(bugId, toStatus as BugStatus);
          }}
          createItemLabel='+ Thêm bug'
        />
      ) : (
        <div className='bg-card border border-border panel p-5'>
          <BugTable
            bugs={groupBy !== 'none' ? filteredBugs : paginatedBugs}
            teamMembers={teamMembers}
            columns={bugColumns}
            sprints={sprints}
            groupBy={groupBy}
            onEdit={openEdit}
            onDelete={setDeletingBug}
            onView={(b) => setViewBug(b)}
            onUpdate={handleUpdateBug}
            inlineUpdatingIds={inlineUpdatingIds}
            updatingColumn={updatingColumn}
          />
          {groupBy === 'none' && <Pagination page={page} totalPages={totalPages} total={filteredBugs.length} limit={PAGE_SIZE} onPageChange={setPage} />}
        </div>
      )}

      {/* ── Dialogs ── */}
      {dialogOpen && (
        <BugDialog
          open={dialogOpen}
          bug={(freshSelectedBugData as BugWithId | null) ?? selectedBug}
          nextId={nextId}
          teamMembers={teamMembers}
          columns={bugColumns}
          sprints={sprints}
          onClose={() => {
            setDialogOpen(false);
            setSelectedBug(null);
          }}
          onSuccess={() => {}}
        />
      )}

      <BugViewSheet
        open={!!viewBug}
        bug={(freshBugData as BugWithId | null) ?? viewBug}
        teamMembers={teamMembers}
        sprints={sprints}
        onClose={() => setViewBug(null)}
        onEdit={() => {
          if (viewBug) openEdit(viewBug);
        }}
        onDelete={() => {
          if (viewBug) setDeletingBug(viewBug);
        }}
      />

      {deletingBug && (
        <ConfirmDialog
          title='Xoá bug'
          message={`Bạn có chắc muốn xoá bug "${deletingBug.title}"? Hành động này không thể hoàn tác.`}
          confirmLabel='Xoá bug'
          danger
          onConfirm={async () => {
            await deleteBug.mutateAsync(deletingBug.id);
            if (viewBug?.id === deletingBug.id) setViewBug(null);
            if (selectedBug?.id === deletingBug.id) {
              setSelectedBug(null);
              setDialogOpen(false);
            }
            setDeletingBug(null);
          }}
          onCancel={() => setDeletingBug(null)}
        />
      )}
    </div>
  );
}
