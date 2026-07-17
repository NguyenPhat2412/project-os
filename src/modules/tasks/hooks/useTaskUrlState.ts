'use client';

import { useCallback, useEffect } from 'react';

import type { Task } from '@/modules/tasks/types/task';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function urlParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

export function useTaskUrlState({ projectId, organizationId, setProjectId }: { projectId: string; organizationId?: string; setProjectId: (projectId: string) => void }) {
  const linkedProjectId = urlParam('projectId');
  const linkedTaskId = urlParam('taskId');
  const activeProjectId = linkedProjectId && UUID_PATTERN.test(linkedProjectId) ? linkedProjectId : projectId;

  const syncTaskUrl = useCallback(
    (task?: Task | null) => {
      if (typeof window === 'undefined' || !activeProjectId) return;
      const url = new URL(window.location.href);
      url.searchParams.set('projectId', activeProjectId);
      if (organizationId) url.searchParams.set('organizationId', organizationId);
      if (task !== undefined) {
        if (task) url.searchParams.set('taskId', task.uuid ?? task.id);
        else url.searchParams.delete('taskId');
      }
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    },
    [activeProjectId, organizationId],
  );

  useEffect(() => {
    if (linkedProjectId && UUID_PATTERN.test(linkedProjectId) && linkedProjectId !== projectId) {
      setProjectId(linkedProjectId);
    }
  }, [linkedProjectId, projectId, setProjectId]);

  useEffect(() => {
    syncTaskUrl();
  }, [syncTaskUrl]);

  return { activeProjectId, linkedTaskId, syncTaskUrl };
}
