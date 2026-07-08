/**
 * Sidebar Store — Zustand.
 *
 * Quản lý sidebar config (variant, collapsible, side).
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface SidebarConfig {
  variant: 'sidebar' | 'floating' | 'inset';
  collapsible: 'offcanvas' | 'icon' | 'none';
  side: 'left' | 'right';
}

interface SidebarState {
  config: SidebarConfig;
}

interface SidebarActions {
  updateConfig: (config: Partial<SidebarConfig>) => void;
}

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  devtools(
    persist(
      (set) => ({
        config: {
          variant: 'inset',
          collapsible: 'offcanvas',
          side: 'left',
        },

        updateConfig: (newConfig) =>
          set((state) => ({
            config: { ...state.config, ...newConfig },
          })),
      }),
      {
        name: 'os-sidebar-config',
        partialize: (state) => ({ config: state.config }),
      }
    ),
    {
      name: 'Sidebar Store',
    }
  )
);

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSidebarConfig() {
  const config = useSidebarStore((s) => s.config);
  const updateConfig = useSidebarStore((s) => s.updateConfig);

  return {
    config,
    updateConfig,
  };
}
