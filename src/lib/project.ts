/**
 * Project constants
 * ───────────────────────
 * Active project ID — resolved via Zustand store's SSR-safe helper.
 *
 * The Zustand persist layer stores projectId in localStorage under
 * `activeProjectId` (see project-store.ts). On SSR or before hydration
 * we fall back to the persisted value by reading localStorage directly.
 * After hydration the Zustand store holds the same value.
 *
 * When the user switches project, Zustand updates + page hard-reloads,
 * so this module re-initializes with the new value and all collections
 * pick it up automatically.
 */

import { getPersistedProjectId, DEFAULT_PROJECT_ID } from '@/store/project-store';

/**
 * Resolves the active project ID:
 * 1. SSR / pre-hydration → read persisted localStorage value via getPersistedProjectId()
 * 2. Not defined         → fall back to NEXT_PUBLIC_PROJECT_ID env var
 * 3. Neither set         → DEFAULT_PROJECT_ID ('ecommerce')
 *
 * All collection factories (createSubcollection(...)(PROJECT_ID)) use this
 * at module initialization time. Components needing reactive projectId should
 * use the `useProject()` hook from '@/store/project-store' instead.
 */
export const PROJECT_ID: string = getPersistedProjectId() || DEFAULT_PROJECT_ID;
