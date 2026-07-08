# API Routing Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 bugs blocking all Firestore REST API calls (404 on `/apiprojects/`) and cleanup duplicate config code.

**Architecture:** Three independent bug fixes to the API client and seed utilities. No feature changes — purely corrective.

**Tech Stack:** Next.js API Routes, Firebase Admin SDK, TypeScript

---

## File Map

| File | Action |
|---|---|
| `src/lib/api/client.ts` | Modify — add trailing slash to baseUrl |
| `src/modules/tasks/collections/config.ts` | Delete — duplicate, use `lib/project-config.ts` instead |
| `src/modules/projects/seeds/seed-utils.ts` | Modify — simplify `deleteProjectDoc` |

---

## Tasks

### Task 1: Fix baseUrl trailing slash → unblocks all API calls

**Files:**
- Modify: `src/lib/api/client.ts:27`

- [ ] **Step 1: Add trailing slash to baseUrl**

```ts
// src/lib/api/client.ts — line 27
constructor(baseUrl = '/api/') {   // ← trailing slash added
  this.baseUrl = baseUrl;
}
```

- [ ] **Step 2: Verify TypeScript — 0 errors**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

Expected: no output (0 errors)

---

### Task 2: Delete duplicate config.ts

**Files:**
- Delete: `src/modules/tasks/collections/config.ts`

- [ ] **Step 1: Verify no imports reference the deleted file**

```bash
grep -rn "dashboardConfigCollection\|sprintConfigCollection\|teamConfigCollection\|riskConfigCollection\|budgetConfigCollection\|timelineConfigCollection\|reportsConfigCollection" /Users/tony/GitLab/claude-project-management/src/ --include="*.ts" --include="*.tsx"
```

Expected: no output (these names don't exist anywhere else in the codebase)

- [ ] **Step 2: Delete the file**

```bash
rm /Users/tony/GitLab/claude-project-management/src/modules/tasks/collections/config.ts
```

- [ ] **Step 3: Verify no broken imports**

```bash
grep -rn "modules/tasks/collections/config" /Users/tony/GitLab/claude-project-management/src/ --include="*.ts" --include="*.tsx"
```

Expected: no output

- [ ] **Step 4: Verify TypeScript — 0 errors**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

### Task 3: Simplify deleteProjectDoc in seed-utils

**Files:**
- Modify: `src/modules/projects/seeds/seed-utils.ts:68-76`

- [ ] **Step 1: Read current function**

```ts
// Current (lines 68-76):
export async function deleteProjectDoc(projectId: string): Promise<boolean> {
  const docRef = doc(db, 'projects', projectId);
  const snap = await getDocs(query(collection(db, 'projects'), where('__name__', '==', projectId)));
  if (!snap.empty) {
    await deleteDoc(docRef);
    return true;
  }
  return false;
}
```

- [ ] **Step 2: Replace with simplified version**

```ts
export async function deleteProjectDoc(projectId: string): Promise<boolean> {
  const docRef = doc(db, 'projects', projectId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await deleteDoc(docRef);
    return true;
  }
  return false;
}
```

Changes:
- `getDoc` (singular) replaces `getDocs(query(...))` + `where` clause
- `snap.exists()` replaces `!snap.empty`

- [ ] **Step 3: Remove unused imports**

Verify `getDoc` is already imported (should be from previous migration). Check line 8 of seed-utils.ts — it imports `doc, getDocs, deleteDoc, collection` from `firebase/firestore`. Add `getDoc`:

```ts
// src/modules/projects/seeds/seed-utils.ts — line 8
import {
  doc, getDoc, getDocs, deleteDoc, collection
} from 'firebase/firestore';
```

Also remove `query` and `where` if no longer used — check after the replacement.

- [ ] **Step 4: Verify TypeScript — 0 errors**

```bash
npx tsc --noEmit 2>&1 | tail -5
```

---

## Success Criteria

1. `npx tsc --noEmit` → 0 errors
2. Dashboard at `http://localhost:3000/dashboard` loads without 404 on API calls
3. No broken imports or missing references

## Rollback

| Task | Rollback |
|---|---|
| Task 1 | Revert `baseUrl = '/api/'` → `baseUrl = '/api'` |
| Task 2 | `git checkout HEAD -- src/modules/tasks/collections/config.ts` |
| Task 3 | Revert `getDoc` → `getDocs(query(collection(...)))` |
