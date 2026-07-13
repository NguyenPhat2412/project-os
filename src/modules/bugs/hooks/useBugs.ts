import { useMemo } from 'react';
import { bugsCollection } from '@/modules/bugs/collections/bugs';
import { BUG_COLUMNS } from '@/modules/bugs/types/bug';
import type { Bug, BugSeverity, BugStatus } from '@/modules/bugs/types/bug';
import type { WithId } from '@/lib/api-rq';

export function useBugs() {
  const { data: raw = [], isLoading } = bugsCollection.useList();
  const bugs = raw as WithId<Bug>[];

  const createBug = bugsCollection.useCreate();
  const updateBug = bugsCollection.useUpdate();
  const deleteBug = bugsCollection.useDelete();

  const stats = useMemo(() => {
    const total = bugs.length;
    const open = bugs.filter((b) => b.status === 'open').length;
    const inProgress = bugs.filter((b) => b.status === 'in-progress' || b.status === 'in-review').length;
    const fixed = bugs.filter((b) => b.status === 'fixed').length;
    const wontFix = bugs.filter((b) => b.status === 'wont-fix').length;
    const closed = fixed + wontFix;
    const fixRate = total > 0 ? Math.round((fixed / total) * 100) : 0;

    const bySeverity: Record<BugSeverity, number> = {
      Critical: bugs.filter((b) => b.severity === 'Critical').length,
      High: bugs.filter((b) => b.severity === 'High').length,
      Medium: bugs.filter((b) => b.severity === 'Medium').length,
      Low: bugs.filter((b) => b.severity === 'Low').length,
    };

    const byStatus: Record<BugStatus, number> = {
      open,
      'in-progress': inProgress,
      'in-review': bugs.filter((b) => b.status === 'in-review').length,
      fixed,
      'wont-fix': wontFix,
    };

    const criticalOpen = bugs.filter((b) => b.severity === 'Critical' && b.status === 'open').length;

    return { total, open, inProgress, fixed, closed, wontFix, fixRate, bySeverity, byStatus, criticalOpen };
  }, [bugs]);

  const byColumn = useMemo(() => {
    const map = new Map<string, WithId<Bug>[]>();
    for (const col of BUG_COLUMNS) map.set(col.id, []);
    for (const bug of [...bugs].sort((a, b) => a.order - b.order)) {
      const bucket = map.get(bug.status);
      if (bucket) bucket.push(bug);
    }
    return map;
  }, [bugs]);

  const nextId = useMemo(() => {
    const nums = bugs.map((b) => parseInt(b.id.replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `BUG-${String(next).padStart(3, '0')}`;
  }, [bugs]);

  return { bugs, stats, byColumn, nextId, isLoading, createBug, updateBug, deleteBug };
}
