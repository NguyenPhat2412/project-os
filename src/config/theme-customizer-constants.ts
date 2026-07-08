import type {
  BrandColor,
  RadiusOption,
  SidebarCollapsibleOption,
  SidebarSideOption,
  SidebarVariant,
} from '@/types/theme-customizer';

export const radiusOptions: RadiusOption[] = [
  { name: '0', value: '0rem' },
  { name: 'S', value: '0.375rem' },
  { name: 'M', value: '0.5rem' },
  { name: 'L', value: '0.75rem' },
  { name: 'XL', value: '1rem' },
];

export const baseColors: BrandColor[] = [
  { name: 'Primary', cssVar: 'primary' },
  { name: 'Secondary', cssVar: 'secondary' },
  { name: 'Accent', cssVar: 'accent' },
  { name: 'Background', cssVar: 'background' },
  { name: 'Sidebar', cssVar: 'sidebar-primary' },
];

export const sidebarVariants: SidebarVariant[] = [
  { name: 'Sidebar', value: 'sidebar', description: 'Standard sidebar layout' },
  { name: 'Floating', value: 'floating', description: 'Floating sidebar with spacing' },
  { name: 'Inset', value: 'inset', description: 'Inset sidebar with framed content' },
];

export const sidebarCollapsibleOptions: SidebarCollapsibleOption[] = [
  { name: 'Offcanvas', value: 'offcanvas', description: 'Slides out of view' },
  { name: 'Icon', value: 'icon', description: 'Collapses to icon rail' },
  { name: 'None', value: 'none', description: 'Always visible' },
];

export const sidebarSideOptions: SidebarSideOption[] = [
  { name: 'Left', value: 'left' },
  { name: 'Right', value: 'right' },
];
