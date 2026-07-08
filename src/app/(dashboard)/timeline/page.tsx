'use client';
import { useState } from 'react';
import { epicsCollection } from '@/modules/backlog/collections/epics';
import { milestonesCollection } from '@/modules/timeline/collections/milestones';
import { PageLoader } from '@/components/ui/page-loader';
import { teamCollection } from '@/modules/team/collections/team';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { ConfirmDialog } from '@/components/ui/shared/confirm-dialog';
import { GanttChart } from '@/modules/timeline/components/GanttChart';
import { MilestonesTable } from '@/modules/timeline/components/MilestonesTable';
import { MilestoneDialog } from '@/modules/timeline/components/MilestoneDialog';
import { TimelineEpicStatsGrid } from '@/modules/timeline/components/TimelineEpicStatsGrid';
import { MilestonesToolbar } from '@/modules/timeline/components/MilestonesToolbar';
import { TimelinePageHeader } from '@/modules/timeline/components/TimelinePageHeader';
import type { Milestone } from '@/modules/timeline/collections/milestones';
import type { TeamMember } from '@/modules/team/types/team';
import type { Epic } from '@/modules/backlog/types/backlog';

export default function TimelinePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<(Milestone & { id: string }) | null>(null);
  const [delTarget, setDelTarget] = useState<(Milestone & { id: string }) | null>(null);

  const { data: epicsRaw = [], isLoading: epicsLoading } = epicsCollection.useList();
  const epics = epicsRaw as (Epic & { id: string })[];

  const { data: milestonesRaw = [], isLoading: milestonesLoading } = milestonesCollection.useList();
  const milestones = milestonesRaw as (Milestone & { id: string })[];
  const deleteMilestone = milestonesCollection.useDelete();

  const { data: batchData, isLoading: batchLoading } = useBatchFetch([createCollectionListItem('teamMembers', teamCollection)]);
  const teamMembers = (batchData.teamMembers ?? []) as TeamMember[];

  const loading = epicsLoading || milestonesLoading || batchLoading;

  if (loading) {
    return <PageLoader />;
  }

  const nextId = (() => {
    const nums = milestones.map((m) => parseInt(m.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `MS-${String(next).padStart(2, '0')}`;
  })();

  const openCreate = () => {
    setEditingMilestone(null);
    setDialogOpen(true);
  };
  const openEdit = (m: Milestone & { id: string }) => {
    setEditingMilestone(m);
    setDialogOpen(true);
  };
  const handleDelete = () => {
    if (!delTarget) return;
    deleteMilestone.mutate(delTarget.id, { onSuccess: () => setDelTarget(null) });
  };

  return (
    <div>
      <TimelinePageHeader />
      <TimelineEpicStatsGrid epics={epics} />

      <GanttChart epics={epics} />

      <MilestonesToolbar onCreate={openCreate} />

      <MilestonesTable milestones={milestones} teamMembers={teamMembers} onEdit={openEdit} onDelete={setDelTarget} />

      <MilestoneDialog open={dialogOpen} milestone={editingMilestone} nextId={nextId} teamMembers={teamMembers} onClose={() => setDialogOpen(false)} onSuccess={() => {}} />

      {delTarget && <ConfirmDialog danger title='Xoá Milestone' message={`Bạn có chắc muốn xoá "${delTarget.name}"? Hành động này không thể hoàn tác.`} confirmLabel='Xoá' onCancel={() => setDelTarget(null)} onConfirm={handleDelete} />}
    </div>
  );
}
