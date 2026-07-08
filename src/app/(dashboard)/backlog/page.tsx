'use client';
import { useState, useMemo } from 'react';
import { epicsCollection } from '@/modules/backlog/collections/epics';
import { teamCollection } from '@/modules/team/collections/team';
import { membersCollection } from '@/modules/team/collections/members';
import { useBatchFetch, createCollectionListItem } from '@/lib/firestore-rq/hooks/useBatchFetch';
import { EpicCard } from '@/modules/backlog/components/EpicCard';
import { EpicViewSheet } from '@/modules/backlog/components/EpicViewSheet';
import { UserStoryViewSheet } from '@/modules/backlog/components/UserStoryViewSheet';
import { EpicDialog } from '@/modules/backlog/components/EpicDialog';
import { UserStoryDialog } from '@/modules/backlog/components/UserStoryDialog';
import { BacklogHeader } from '@/modules/backlog/components/BacklogHeader';
import { PageLoader } from '@/components/ui/page-loader';
import type { EpicData, EpicItem } from '@/modules/backlog/types/backlog';
import type { TeamMember, TeamMemberWithRole, ProjectTeamMember } from '@/modules/team/types/team';

export default function BacklogPage() {
  // Epic view/dialog state
  const [viewingEpic, setViewingEpic] = useState<EpicData | null>(null);
  const [epicDialogOpen, setEpicDialogOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<EpicData | null>(null);

  // User Story view/dialog state
  const [viewingStoryEpic, setViewingStoryEpic] = useState<EpicData | null>(null);
  const [viewingStory, setViewingStory] = useState<EpicItem | null>(null);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [storyParentEpic, setStoryParentEpic] = useState<EpicData | null>(null);
  const [editingStory, setEditingStory] = useState<EpicItem | null>(null);

  const { data: rawEpics = [], isLoading } = epicsCollection.useList();
  const { data: freshEpicData } = epicsCollection.useDocument(viewingEpic?.id ?? null, { staleTime: 0 });
  const { data: freshStoryEpicData } = epicsCollection.useDocument(viewingStoryEpic?.id ?? null, { staleTime: 0 });
  const { data: freshEditingEpicData } = epicsCollection.useDocument(editingEpic?.id ?? null, { staleTime: 0 });
  const { data: freshStoryParentEpicData } = epicsCollection.useDocument(storyParentEpic?.id ?? null, { staleTime: 0 });
  const epics = rawEpics as EpicData[];

  const { data: batchData } = useBatchFetch([createCollectionListItem('teamMembers', teamCollection), createCollectionListItem('rootMembers', membersCollection)]);
  const projectMemberEntries = (batchData.teamMembers ?? []) as unknown as (ProjectTeamMember & { id: string })[];
  const rootMembers = (batchData.rootMembers ?? []) as TeamMember[];
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

  // ── Epic handlers ────────────────────────────────────────────────────────
  const openCreateEpic = () => {
    setEditingEpic(null);
    setEpicDialogOpen(true);
  };

  const openEditEpic = (epic: EpicData) => {
    setEditingEpic(epic);
    setEpicDialogOpen(true);
  };

  const nextEpicId = (() => {
    const nums = epics.map((e) => parseInt(e.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `EP-${String(next).padStart(2, '0')}`;
  })();

  // ── User Story handlers ──────────────────────────────────────────────────
  const openAddStory = (epic: EpicData) => {
    setStoryParentEpic(epic);
    setEditingStory(null);
    setStoryDialogOpen(true);
  };

  const openEditStory = (epic: EpicData, item: EpicItem) => {
    setStoryParentEpic(epic);
    setEditingStory(item);
    setStoryDialogOpen(true);
  };

  // Delete handled directly via ConfirmDialog in UserStoryDialog (delete button)
  const openDeleteStory = (epic: EpicData, item: EpicItem) => {
    setStoryParentEpic(epic);
    setEditingStory(item);
    setStoryDialogOpen(true);
  };

  // Next story ID: scan all items across all epics
  const nextStoryId = (() => {
    const allItems = epics.flatMap((e) => e.items);
    const nums = allItems.map((i) => parseInt(i.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `US-${String(next).padStart(3, '0')}`;
  })();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      <BacklogHeader onCreate={openCreateEpic} />

      {epics.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground bg-card border border-border panel'>
          <span className='text-4xl'>📋</span>
          <p className='text-[13px]'>Chưa có epic nào. Nhấn &quot;Thêm Epic&quot; để bắt đầu.</p>
        </div>
      )}

      {epics.map((epic) => (
        <EpicCard
          key={epic.id}
          epic={epic}
          teamMembers={teamMembers}
          onViewEpic={setViewingEpic}
          onEditEpic={openEditEpic}
          onAddStory={openAddStory}
          onViewStory={(e, item) => {
            setViewingStoryEpic(e);
            setViewingStory(item);
          }}
          onEditStory={openEditStory}
          onDeleteStory={openDeleteStory}
        />
      ))}

      {/* Epic View Sheet */}
      <EpicViewSheet
        open={!!viewingEpic}
        epic={(freshEpicData as EpicData | null) ?? viewingEpic}
        onClose={() => setViewingEpic(null)}
        onEdit={() => {
          if (viewingEpic) {
            openEditEpic(viewingEpic);
            setViewingEpic(null);
          }
        }}
      />

      {/* User Story View Sheet */}
      <UserStoryViewSheet
        open={!!viewingStory}
        epic={(freshStoryEpicData as EpicData | null) ?? viewingStoryEpic}
        story={(freshStoryEpicData as EpicData | null)?.items?.find((i) => i.id === viewingStory?.id) ?? viewingStory}
        teamMembers={teamMembers}
        onClose={() => {
          setViewingStory(null);
          setViewingStoryEpic(null);
        }}
        onEdit={() => {
          if (viewingStoryEpic && viewingStory) {
            openEditStory(viewingStoryEpic, viewingStory);
            setViewingStory(null);
            setViewingStoryEpic(null);
          }
        }}
      />

      {/* Epic Add/Edit Dialog */}
      {epicDialogOpen && (
        <EpicDialog
          open={epicDialogOpen}
          epic={(freshEditingEpicData as EpicData | null) ?? editingEpic}
          nextId={nextEpicId}
          existingEpicNames={epics.map((e) => e.name)}
          onClose={() => setEpicDialogOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {/* User Story Add/Edit/Delete Dialog */}
      {storyDialogOpen && storyParentEpic && (
        <UserStoryDialog
          open={storyDialogOpen}
          epic={(freshStoryParentEpicData as EpicData | null) ?? storyParentEpic}
          story={(freshStoryParentEpicData as EpicData | null)?.items?.find((i) => i.id === editingStory?.id) ?? editingStory}
          nextStoryId={nextStoryId}
          teamMembers={teamMembers}
          onClose={() => setStoryDialogOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
