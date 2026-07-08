import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ImportedTheme } from '@/types/theme-customizer';

interface ThemeCustomizerState {
  selectedTheme: string;
  selectedTweakcnTheme: string;
  selectedRadius: string;
  importedTheme: ImportedTheme | null;
}

interface ThemeCustomizerActions {
  setSelectedTheme: (v: string) => void;
  setSelectedTweakcnTheme: (v: string) => void;
  setSelectedRadius: (v: string) => void;
  setImportedTheme: (v: ImportedTheme | null) => void;
  resetCustomizer: () => void;
}

const DEFAULT_STATE: ThemeCustomizerState = {
  selectedTheme: 'default',
  selectedTweakcnTheme: '',
  selectedRadius: '0.5rem',
  importedTheme: null,
};

export const useThemeCustomizerStore = create<ThemeCustomizerState & ThemeCustomizerActions>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_STATE,
        setSelectedTheme: (selectedTheme) => set({ selectedTheme }),
        setSelectedTweakcnTheme: (selectedTweakcnTheme) => set({ selectedTweakcnTheme }),
        setSelectedRadius: (selectedRadius) => set({ selectedRadius }),
        setImportedTheme: (importedTheme) => set({ importedTheme }),
        resetCustomizer: () => set(DEFAULT_STATE),
      }),
      {
        name: 'os-theme-customizer',
        partialize: (state) => ({
          selectedTheme: state.selectedTheme,
          selectedTweakcnTheme: state.selectedTweakcnTheme,
          selectedRadius: state.selectedRadius,
          importedTheme: state.importedTheme,
        }),
        onRehydrateStorage: () => (state) => {
          // Apply radius on rehydrate — color theme is re-applied by useEffect in ThemeCustomizer
          if (typeof window === 'undefined' || !state) return;
          if (state.selectedRadius && state.selectedRadius !== '0.5rem') {
            document.documentElement.style.setProperty('--radius', state.selectedRadius);
          }
        },
      },
    ),
    {
      name: 'Theme Customizer Store',
    },
  ),
);
