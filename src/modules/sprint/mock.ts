/**
 * mock.ts — Sprint module
 * ────────────────────────
 * Mock sprints for seeding. Follows JIRA-style sprint model.
 */

import type { Sprint } from '@/modules/sprint/types/sprint';

export const sprints: (Omit<Sprint, 'id'> & { id: string })[] = [
  {
    id: 'SPRINT-07',
    name: 'Sprint 07',
    startDate: '2026-02-02',
    endDate: '2026-02-15',
    goal: 'Hoàn thiện module xác thực người dùng và tích hợp OAuth.',
    status: 'completed',
    order: 7,
  },
  {
    id: 'SPRINT-08',
    name: 'Sprint 08',
    startDate: '2026-03-02',
    endDate: '2026-03-15',
    goal: 'Xây dựng tính năng thanh toán VNPay và tối ưu hiệu năng trang sản phẩm.',
    status: 'active',
    order: 8,
  },
  {
    id: 'SPRINT-09',
    name: 'Sprint 09',
    startDate: '2026-03-16',
    endDate: '2026-03-29',
    goal: 'Triển khai hệ thống thông báo realtime và tính năng so sánh sản phẩm.',
    status: 'planned',
    order: 9,
  },
];
