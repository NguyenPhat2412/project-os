/**
 * Pre-defined config document helpers cho ProjectOS.
 * Dùng cho các config document trong projects/{projectId}/config/{name}
 *
 * Thay vì gọi getDoc/doc trực tiếp trong component,
 * luôn dùng configCollection.helpers.fetch() hoặc configCollection.useDocument().
 *
 * @example
 * ```ts
 * // Read trong useEffect
 * const snap = await dashboardConfig.helpers.fetch();
 *
 * // Read trong component (React Query)
 * const { data } = dashboardConfig.useDocument();
 *
 * // Write
 * const set = dashboardConfig.useSet();
 * set.mutate({ id: 'dashboard', data: { ... } });
 * ```
 */
import { createConfig } from '@/lib/api-rq';
import { ACTIVE_PROJECT_SCOPE } from '@/lib/project';

// Base path cho tất cả config documents
const CONFIG_BASE = `projects/${ACTIVE_PROJECT_SCOPE}/config`;

// ─── Type definitions ──────────────────────────────────────────────────────────

export interface DashboardConfig {
  stats?: { label: string; value: string; icon?: string; trend?: string }[];
  sprintProgress?: { current: number; label: string };
  priorityTasks?: { id: string; label: string; done: boolean; priority: string }[];
  baStats?: { value: number; label: string }[];
  baProgress?: { label: string; value: number }[];
  qaStats?: { value: string; label: string; color?: string }[];
  deployEnvs?: {
    status: 'ok' | 'warn' | 'error';
    name: string;
    badge: { label: string; variant: 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted' };
    meta: string;
  }[];
  upcomingMeetings?: unknown[];
}

export interface BudgetConfig {
  totalBudget?: number;
  currency?: string;
  lastUpdated?: string;
}

export interface ReportsConfig {
  stats?: { label: string; value: string; icon?: string; trend?: string }[];
  sprintMetrics?: { sprint: string; planned: number; completed: number; bugs: number }[];
  burndownPoints?: { day: string; remaining: number }[];
}

export interface SprintConfig {
  activeSprintId?: string;
  sprintGoal?: string;
}

export type AIProvider = 'CLAUDE' | 'GEMINI';

export interface AISettingsConfig {
  provider?: AIProvider;
  updatedAt?: string;
}

/** Brightness dimension — stored per user; 'system' follows OS/browser */
export type ThemeMode = 'dark' | 'light' | 'system';
/** Color-scheme dimension — stored per user */
export type ThemeName = 'accent' | 'neon' | 'magenta' | 'volcano' | 'blue' | 'purple';

export interface ThemeSettingsConfig {
  name?: ThemeName;
  mode?: ThemeMode;
}

// ─── User Profile ──────────────────────────────────────────────────────────────

export interface NotificationPrefs {
  email: boolean;
  desktop: boolean;
  slack: boolean;
}

export interface UserProfile {
  /** Identity service user UUID. */
  uid: string;
  /** Identity fields (read-only, synchronized on login). */
  email?: string;
  displayName?: string;
  photoURL?: string;
  /** App-level profile fields (editable) */
  phone?: string;
  department?: string;
  title?: string;
  address?: string;
  timezone?: string;
  bio?: string;
  skills?: string[];
  notificationPrefs?: NotificationPrefs;
  /** Theme preference (per user — overrides project-level config) */
  themeName?: ThemeName;
  themeMode?: ThemeMode;
  /** Timestamps */
  createdAt?: string;
  updatedAt?: string;
}

// ─── Config collections ────────────────────────────────────────────────────────

export const dashboardConfig = createConfig<DashboardConfig>({
  basePath: CONFIG_BASE,
  projectId: ACTIVE_PROJECT_SCOPE,
  name: 'dashboard',
});

export const budgetConfig = createConfig<BudgetConfig>({
  basePath: CONFIG_BASE,
  projectId: ACTIVE_PROJECT_SCOPE,
  name: 'budget',
});

export const reportsConfig = createConfig<ReportsConfig>({
  basePath: CONFIG_BASE,
  projectId: ACTIVE_PROJECT_SCOPE,
  name: 'reports',
});

export const sprintConfig = createConfig<SprintConfig>({
  basePath: CONFIG_BASE,
  projectId: ACTIVE_PROJECT_SCOPE,
  name: 'sprint',
});

export const aiSettingsConfig = createConfig<AISettingsConfig>({
  basePath: CONFIG_BASE,
  projectId: ACTIVE_PROJECT_SCOPE,
  name: 'ai_settings',
});

export const themeConfig = createConfig<ThemeSettingsConfig>({
  basePath: CONFIG_BASE,
  projectId: ACTIVE_PROJECT_SCOPE,
  name: 'theme',
});

export const profileConfig = createConfig<UserProfile>({
  basePath: `projects/${ACTIVE_PROJECT_SCOPE}/user_profiles`,
  projectId: ACTIVE_PROJECT_SCOPE,
  name: 'profile',
});
