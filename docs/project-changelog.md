# Project Changelog — ProjectOS

> Detailed record of all significant changes, features, and fixes.
> Updated by `project-manager` agent after each major change.
> Format: `## [version] — YYYY-MM-DD`

---

## [Unreleased]

### In Progress

- Test suite setup (Jest + React Testing Library)
- Firestore Security Rules comprehensive review

---

## [0.6.0] — 2026-03-29

### Added

- **Full RBAC Authorization System** — 2-tier roles:
  - **Root roles** (`members/{uid}/roles`): global roles stored per user
  - **Project roles** (`projects/{id}/project_roles/{uid}`): per-project RBAC roles
  - Zustand store (`src/store/auth-store.ts`) with persistence — stores `rootRoles`, `projectRoles`
  - `usePermission` hook for permission checks (`isRootAdmin()`, `isAdmin()`, `hasRole()`)
  - `AdminGuard` component protecting all `/admin/**` routes
  - Role "Administrators" is immutable (cannot edit/delete)
  - Admin access: `Administrators` role OR `ngothanhtung.it@gmail.com`
- **Root Roles Management** page at `/admin/roles` — grant/revoke root roles
- **Project Roles tab** redesign:
  - 3:1 split layout (Members 3/4 | Role Definitions 1/4)
  - TanStack Table v8 for both members and role definitions
  - Full CRUD for role definitions (create/edit/delete) via Firestore
  - Inline grant/revoke RBAC roles with dropdown + dismissible badge buttons
  - Immutable "Project Admin" role definition protected from edit/delete
  - "Tạo mặc định" button creates default role definitions
- **ProjectMembersTable** — RBAC roles column with checkbox modal for multi-select role assignment
- Firestore collections: `members`, `project_roles`, `role_definitions`

### Changed

- `AuthContext` integrated with Zustand store — loads `rootRoles` on login
- `Sidebar` — admin section visible only when `hydrated && isRootAdmin()`
- `TeamMember` type extended with `roles: string[]`
- `RoleDefinition` type with `createdAt/updatedAt` as `Date` (not string)

---

## [0.5.0] — 2026-03-24

### Added

- **Table Grouping Feature**:
  - New `groupItems<T>()` utility function (`src/lib/utils/group-items.ts`) for generic table row grouping
  - New `GroupableField<T>` interface (`src/lib/types/grouping.ts`) to define groupable columns with custom label resolution and ordering
  - New `GroupedData<T>` interface for type-safe grouped data structure
  - New `GroupSectionHeader` component (`src/components/shared/GroupSectionHeader.tsx`) for collapsible group headers
  - Table grouping integrated into `TaskListView` and `BugTable` components with support for grouping by status, priority, assignee, severity
  - Collapsible group sections with expand/collapse UI state management

### Files Changed

- `src/lib/utils/group-items.ts` — NEW
- `src/lib/types/grouping.ts` — NEW
- `src/components/shared/GroupSectionHeader.tsx` — NEW
- `src/modules/tasks/components/TaskListView.tsx` — Added groupBy prop and grouping logic
- `src/modules/bugs/components/BugTable.tsx` — Added groupBy prop and grouping logic
- `src/lib/types/index.ts` — Exported grouping types

### Deployment Status

- Code complete and tested
- Ready for deployment to Vercel

---

## [0.4.0] — 2026-03-23

### Changed

- **Layout & Sidebar**: Update layout and sidebar paths for consistency
- **Stats Panels**: Enhanced bug and team stats panels with better data display

### Added

- Stats panels for budget, risk, and tasks pages
- **Activity Page Enhancement**:
  - New `ActivityStatsPanel` component with 4 stats cards (tasks done/total, bugs open, sprints active, meetings total)
  - Recharts vertical `BarChart` showing activity type breakdown (Tasks, Bugs, Sprints, Meetings)
  - New `ActivityLogTable` component using TanStack React Table v8 with filter tabs
  - Updated `ActivityContent` to display stats above activity feed

---

## [0.3.0] — 2026-03

### Refactored

- **KanbanView**: Replace `TaskKanbanView` with generic `KanbanView` component (reusable across modules)
- **UI Consistency**: Standardized button and input styles to `rounded-sm`
- **Code Quality**: Improved code formatting and readability across multiple components

### Added

- **Pagination**: Client-side pagination for tasks and bugs pages

---

## [0.2.0] — 2025-Q4

### Added

- All 12 core modules implemented:
  - Dashboard, Tasks, Sprint, Backlog, Timeline
  - Team, Budget, Risk, Documents, Meetings
  - Reports, Activity
- Empty-start data flow with Firestore-backed records
- Firebase Auth integration (Google + Email)
- ProjectDataContext global state management

---

## [0.1.0] — 2025-Q3

### Added

- Project initialization
- Next.js 16 + App Router setup
- Tailwind CSS v4 + Shadcn UI (base-nova)
- Firebase configuration
- Auth flow (login page, AuthGuard)
- Base layout (AppShell, Sidebar, Topbar)

---

---

**Last updated:** 2026-03-23 | **Updated by:** documentation-manager agent
