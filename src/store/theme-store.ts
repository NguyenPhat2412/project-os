/**
 * Theme Store — Zustand với persistence.
 *
 * Quản lý theme state (dark/light/system) với localStorage persistence.
 * Tích hợp với Tailwind CSS class-based theming.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';

export type { Theme };

interface ThemeState {
  theme: Theme;
  hydrated: boolean;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  setHydrated: (hydrated: boolean) => void;
}

export type { ThemeState, ThemeActions };

const STORAGE_KEY = 'vite-ui-theme';

export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        hydrated: false,

        setTheme: (theme) => {
          set({ theme });
          applyThemeToDOM(theme);
        },

        setHydrated: (hydrated) => set({ hydrated }),
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({ theme: state.theme }),
        onRehydrateStorage: () => (state) => {
          state?.setHydrated(true);
          // Apply theme after rehydration
          if (typeof window !== 'undefined') {
            applyThemeToDOM(state?.theme ?? 'system');
          }
        },
      }
    ),
    {
      name: 'Theme Store',
    }
  )
);

// ─── Apply theme to DOM ──────────────────────────────────────────────────────

function applyThemeToDOM(theme: Theme) {
  if (typeof window === 'undefined') return;

  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrated = useThemeStore((s) => s.hydrated);

  return {
    theme,
    setTheme,
    hydrated,
  };
}

// ─── Side Effects ─────────────────────────────────────────────────────────────

export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  // Sync theme to DOM
  if (typeof window !== 'undefined') {
    applyThemeToDOM(theme);
  }
}
