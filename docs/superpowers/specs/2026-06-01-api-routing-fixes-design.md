# API Routing Fixes — Spec

**Date:** 2026-06-01
**Status:** Draft
**Scope:** 3 bugs in the BFF API routing layer

---

## 1. `/apiprojects/` — baseUrl Missing Trailing Slash

### Root Cause

`ApiClient` in `src/lib/api/client.ts` is instantiated with `baseUrl = '/api'`.

When `apiClient.get('projects/default/tasks')` is called, the URL resolves to:

```
'/api' + 'projects/default/tasks' = '/apiprojects/default/tasks'
                                         ↑
                              No slash between 'api' and 'projects'
```

This causes **all** Firestore REST calls from the client to return 404.

### Fix

```ts
// src/lib/api/client.ts — line 27
constructor(baseUrl = '/api/') {   // ← trailing slash added
  this.baseUrl = baseUrl;
}
```

With `baseUrl = '/api/'`, the URL correctly becomes `/api/projects/default/tasks`.

**Files affected:** `src/lib/api/client.ts` (1 line change)

---

## 2. Config Documents — Wrong Collection Factory

### Root Cause

7 config document exports in `src/modules/tasks/collections/config.ts` use `createCollection` (for general collections), but they should use `createConfig` (for config documents).

`createCollection` sends requests to `/api/collections/`:
```
GET /api/collections/projects/default/config/dashboard
```

`createConfig` sends requests to `/api/config/`:
```
GET /api/config/default/dashboard
```

The `/api/collections/` route doesn't know how to route `projects/default/config/dashboard` — it expects collection names like `tasks`, `bugs`, not `projects/default/config/...`.

### Fix

**Delete** `src/modules/tasks/collections/config.ts` entirely.

The `lib/project-config.ts` already exports the same 7 configs (dashboard, budget, reports, sprint, aiSettings, theme, profile) using `createConfig` — correct pattern. These 7 duplicates are unnecessary and conflicting.

**Files affected:**
- DELETE: `src/modules/tasks/collections/config.ts`

### Verification

After deletion, grep for `dashboardConfigCollection`, `sprintConfigCollection`, `teamConfigCollection`, `riskConfigCollection`, `budgetConfigCollection`, `timelineConfigCollection`, `reportsConfigCollection` — none should remain (they are not imported anywhere else based on codebase review).

---

## 3. seed-utils — deleteProjectDoc Query Redundancy

### Root Cause

`deleteProjectDoc` in `src/modules/projects/seeds/seed-utils.ts` uses both `doc()` and a `query` + `getDocs()` unnecessarily:

```ts
const docRef = doc(db, 'projects', projectId);           // docRef created
const snap = await getDocs(query(...where('__name__', '==', projectId))); // query created
if (!snap.empty) { await deleteDoc(docRef); }            // docRef deleted
```

### Fix

Simplify to direct doc fetch + delete:

```ts
export async function deleteProjectDoc(projectId: string): Promise<boolean> {
  const docRef = doc(db, 'projects', projectId);
  const snap = await getDoc(docRef);      // ← getDoc, not getDocs(query)
  if (snap.exists()) {
    await deleteDoc(docRef);
    return true;
  }
  return false;
}
```

**Files affected:** `src/modules/projects/seeds/seed-utils.ts`

---

## Implementation Order

1. **Fix #1** — `baseUrl` trailing slash (unblocks all API calls)
2. **Delete #2** — remove duplicate config.ts
3. **Fix #3** — simplify `deleteProjectDoc`

---

## Rollback Plan

All changes are in distinct files. Rollback = revert specific lines or delete file.

---

## Success Criteria

- All API calls resolve to `/api/...` not `/apiprojects/...`
- `dashboardConfig`, `sprintConfig`, `budgetConfig` etc. still work (via `lib/project-config.ts`)
- Seed reset/clear still functions correctly
- TypeScript: 0 errors
