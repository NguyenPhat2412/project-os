# Development Roadmap — ProjectOS

> Living document tracking project phases, milestones, and progress.
> Updated by `project-manager` agent after major feature completions.

---

## Project Overview

**ProjectOS** — Ứng dụng quản lý dự án phần mềm cho team kỹ thuật.
Stack: Next.js 16 + Firebase + Tailwind CSS v4 + Shadcn UI

---

## Phase 1 — Core Modules ✅ Completed

| Module | Route | Status |
| ------ | ----- | ------ |
| Dashboard | `/` | ✅ Done |
| Tasks (List/Kanban/Calendar) | `/tasks` | ✅ Done |
| Sprint Board | `/sprint` | ✅ Done |
| Backlog & Epics | `/backlog` | ✅ Done |
| Timeline / Gantt | `/timeline` | ✅ Done |
| Team Members | `/team` | ✅ Done |
| Budget & Expenses | `/budget` | ✅ Done |
| Risk Register | `/risk` | ✅ Done |
| Documents & Wiki | `/docs` | ✅ Done |
| Meetings & Notes | `/meetings` | ✅ Done |
| Reports & Analytics | `/reports` | ✅ Done |
| Activity Feed | `/activity` | ✅ Done |

---

## Phase 2 — Quality & Polish 🔄 In Progress

| Item | Status | Notes |
| ---- | ------ | ----- |
| Stats panels (Dashboard, Budget, Risk, Tasks) | ✅ Done | Commit d191416 |
| Layout & sidebar refinement | ✅ Done | Commit 261c215 |
| Client-side pagination | ✅ Done | Commit 6bc0f25 |
| Generic KanbanView component | ✅ Done | Commit 0f0f359 |
| UI consistency (buttons, inputs) | ✅ Done | Commit 210c524 |
| Activity page enhancement (Stats + Table) | ✅ Done | ActivityStatsPanel + ActivityLogTable |
| Table grouping feature | ✅ Done | [Plan](../plans/260324-table-grouping-feature/plan.md) - groupItems() + GroupableField pattern |
| Test suite setup | ⏳ Pending | Xem docs/testing.md |
| Firestore Security Rules review | ⏳ Pending | |
| Performance audit | ⏳ Pending | |

---

## Phase 3 — Advanced Features 📋 Planned

| Feature | Priority | Notes |
| ------- | -------- | ----- |
| Real-time notifications | P2 | Cloud Functions trigger |
| Export reports (PDF/Excel) | P2 | Cloud Functions |
| Email notifications | P3 | Cloud Functions |
| Mobile responsive polish | P2 | 375px breakpoint |
| Dark/light theme toggle | P3 | Currently hardcoded dark |
| Multi-language support | P3 | Currently Vietnamese |

---

## Milestones

| Milestone | Target | Status |
| --------- | ------ | ------ |
| MVP — 12 core modules | 2024 Q4 | ✅ Achieved |
| Quality Phase | 2025 Q1 | 🔄 In Progress |
| Advanced Features | 2025 Q2 | 📋 Planned |

---

---

**Last updated:** 2026-03-24 | **Updated by:** project-manager agent
