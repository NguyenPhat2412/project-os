/**
 * mock.ts — Timeline module
 * ───────────────────────
 * Mock data for gantt phases and milestones.
 */

import type { GanttPhase } from '@/modules/timeline/collections/ganttPhases';
import type { Milestone } from '@/modules/timeline/collections/milestones';

export const ganttPhases: GanttPhase[] = [
  { rowLabel: "Phân tích & Thiết kế", label: "Tháng 1-2", leftPercent: 0, widthPercent: 33, color: "#6c63ff" },
  { rowLabel: "Phát triển Backend", label: "T2 - T4", leftPercent: 16, widthPercent: 50, color: "#22c55e" },
  { rowLabel: "Phát triển Frontend", label: "T2 - T5", leftPercent: 16, widthPercent: 58, color: "#f59e0b" },
  { rowLabel: "QA & Testing", label: "T3 - T6", leftPercent: 33, widthPercent: 50, color: "#ec4899" },
  { rowLabel: "Triển khai & UAT", label: "T5 - T6", leftPercent: 66, widthPercent: 25, color: "#06b6d4" },
  { rowLabel: "Go Live", label: "T6", leftPercent: 91, widthPercent: 9, color: "#a855f7" },
];

export const milestones: Milestone[] = [
  { id: "MS-01", name: "Kickoff dự án", date: "01/01/2026", status: "Hoàn thành", ownerId: "TM-01" },
  { id: "MS-02", name: "Hoàn thành BA & thiết kế", date: "28/02/2026", status: "Hoàn thành", ownerId: "TM-08" },
  { id: "MS-03", name: "Alpha Release (nội bộ)", date: "31/03/2026", status: "Đang thực hiện", ownerId: "TM-02" },
  { id: "MS-04", name: "Beta Release & UAT", date: "31/05/2026", status: "Chưa bắt đầu", ownerId: "TM-06" },
  { id: "MS-05", name: "Go Live Production", date: "30/06/2026", status: "Chưa bắt đầu", ownerId: "TM-07" },
];
