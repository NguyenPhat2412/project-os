/**
 * Project Store — Zustand với persistence.
 *
 * Quản lý active project ID với localStorage persistence.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const DEFAULT_PROJECT_ID = '';

/**
 * SSR-safe projectId getter for use at module-initialization time.
 * Reads Zustand's own persist storage key (`activeProjectId`) so
 * request-scoped API paths can resolve the active UUID before Zustand hydrates.
 * After hydration, Zustand store holds the same value — both sources align.
 */
function getPersistedProjectId(): string {
  if (typeof window !== 'undefined') {
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
            window.location.href = '/dashboard';
          }
        },

        setHydrated: (hydrated) => set({ hydrated }),
      }),
      {
        name: 'activeProjectId',
        partialize: (state) => ({ projectId: state.projectId }),
        onRehydrateStorage: () => (state) => {
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
  const switchProject = useProjectStore((s) => s.switchProject);

  return {
    projectId,
    switchProject,
  };
}
