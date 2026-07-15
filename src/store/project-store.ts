/**
 * Project Store — Zustand với persistence.
 *
 * Quản lý active project ID với localStorage persistence.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const DEFAULT_PROJECT_ID = '';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function projectIdFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const projectId = new URLSearchParams(window.location.search).get('projectId') ?? '';
  return UUID_PATTERN.test(projectId) ? projectId : '';
}

/**
 * SSR-safe projectId getter for use at module-initialization time.
 * Reads Zustand's own persist storage key (`activeProjectId`) so
 * request-scoped API paths can resolve the active UUID before Zustand hydrates.
 * After hydration, Zustand store holds the same value — both sources align.
 */
function getPersistedProjectId(): string {
  if (typeof window !== 'undefined') {
    const linkedProjectId = projectIdFromUrl();
    if (linkedProjectId) return linkedProjectId;
    try {
      const raw = localStorage.getItem('activeProjectId');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state?.projectId) return parsed.state.projectId;
      }
    } catch {
      // ignore parse errors
    }
  }
  return DEFAULT_PROJECT_ID;
}

export { DEFAULT_PROJECT_ID, getPersistedProjectId };

interface ProjectState {
  projectId: string;
  hydrated: boolean;
}

interface ProjectActions {
  setProjectId: (id: string) => void;
  switchProject: (id: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  devtools(
    persist(
      (set) => ({
        projectId: getPersistedProjectId(),
        hydrated: false,

        setProjectId: (projectId) => set({ projectId }),

        switchProject: (id) => {
          set({ projectId: id });
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (id) url.searchParams.set('projectId', id);
            else url.searchParams.delete('projectId');
            url.searchParams.delete('taskId');
            window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
          }
        },

        setHydrated: (hydrated) => set({ hydrated }),
      }),
      {
        name: 'activeProjectId',
        partialize: (state) => ({ projectId: state.projectId }),
        onRehydrateStorage: () => (state) => {
          const linkedProjectId = projectIdFromUrl();
          if (linkedProjectId) state?.setProjectId(linkedProjectId);
          state?.setHydrated(true);
        },
      }
    ),
    {
      name: 'Project Store',
    }
  )
);

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProject() {
  const projectId = useProjectStore((s) => s.projectId);
  const setProjectId = useProjectStore((s) => s.setProjectId);
  const switchProject = useProjectStore((s) => s.switchProject);

  return {
    projectId,
    setProjectId,
    switchProject,
  };
}
