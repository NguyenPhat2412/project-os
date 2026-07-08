import { shadcnThemePresets } from '@/utils/shadcn-ui-theme-presets';
import { tweakcnPresets } from '@/utils/tweakcn-theme-presets';

function toThemeList(source: Record<string, { label?: string; styles: { light: Record<string, string>; dark: Record<string, string> } }>) {
  return Object.entries(source).map(([value, preset]) => ({
    name: preset.label ?? value,
    value,
    preset,
  }));
}

export const colorThemes = toThemeList(shadcnThemePresets);
export const tweakcnThemes = toThemeList(tweakcnPresets);
