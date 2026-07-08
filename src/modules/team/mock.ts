/**
 * mock.ts — Team module
 * ───────────────────────
 * Mock data for team.
 */

import type { TeamMember } from '@/modules/team/types/team';

/**
 * Global company member registry — all members across all projects.
 * Used by /admin/members (membersCollection).
 */
export const allMembers: TeamMember[] = [
  { id: 'MEM-01', name: 'Anh Nguyễn', displayName: 'Anh Nguyễn', email: 'anh.nguyen@company.vn', initials: 'AN', gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)', roles: ['Frontend Lead'], taskCount: 18, workload: 85, status: 'Active' },
  { id: 'MEM-02', name: 'Bảo Trần', displayName: 'Bảo Trần', email: 'bao.tran@company.vn', initials: 'BT', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', roles: ['Backend Lead'], taskCount: 22, workload: 95, status: 'Overloaded' },
  { id: 'MEM-03', name: 'Chi Hoàng', displayName: 'Chi Hoàng', email: 'chi.hoang@company.vn', initials: 'CH', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', roles: ['Frontend Developer'], taskCount: 15, workload: 70, status: 'Active' },
  { id: 'MEM-04', name: 'Duy Lê', displayName: 'Duy Lê', email: 'duy.le@company.vn', initials: 'DL', gradient: 'linear-gradient(135deg,#ec4899,#be185d)', roles: ['Backend Developer'], taskCount: 19, workload: 80, status: 'Busy' },
  { id: 'MEM-05', name: 'Ema Vũ', displayName: 'Ema Vũ', email: 'ema.vu@company.vn', initials: 'EV', gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)', roles: ['UI/UX Designer'], taskCount: 12, workload: 60, status: 'Active' },
  { id: 'MEM-06', name: 'Phong Ngô', displayName: 'Phong Ngô', email: 'phong.ngo@company.vn', initials: 'FN', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', roles: ['QA Engineer'], taskCount: 20, workload: 75, status: 'Active' },
  { id: 'MEM-07', name: 'Giang Phan', displayName: 'Giang Phan', email: 'giang.phan@company.vn', initials: 'GP', gradient: 'linear-gradient(135deg,#f97316,#ea580c)', roles: ['DevOps Engineer'], taskCount: 14, workload: 65, status: 'Active' },
  { id: 'MEM-08', name: 'Hoa Đỗ', displayName: 'Hoa Đỗ', email: 'hoa.do@company.vn', initials: 'HD', gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)', roles: ['Business Analyst'], taskCount: 7, workload: 40, status: 'Vacant' },
  { id: 'MEM-09', name: 'Khánh Bùi', displayName: 'Khánh Bùi', email: 'khanh.bui@company.vn', initials: 'KB', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', roles: ['Mobile Developer'], taskCount: 16, workload: 78, status: 'Busy' },
  { id: 'MEM-10', name: 'Linh Trương', displayName: 'Linh Trương', email: 'linh.truong@company.vn', initials: 'LT', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', roles: ['Security Engineer'], taskCount: 10, workload: 55, status: 'Active' },
  { id: 'MEM-11', name: 'Minh Đặng', displayName: 'Minh Đặng', email: 'minh.dang@company.vn', initials: 'MD', gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', roles: ['Project Manager'], taskCount: 5, workload: 45, status: 'Active' },
  { id: 'MEM-12', name: 'Nam Lý', displayName: 'Nam Lý', email: 'nam.ly@company.vn', initials: 'NL', gradient: 'linear-gradient(135deg,#10b981,#059669)', roles: ['Data Engineer'], taskCount: 11, workload: 58, status: 'Active' },
  { id: 'MEM-13', name: 'Oanh Phạm', displayName: 'Oanh Phạm', email: 'oanh.pham@company.vn', initials: 'OP', gradient: 'linear-gradient(135deg,#f59e0b,#b45309)', roles: ['QA Engineer'], taskCount: 17, workload: 88, status: 'Overloaded' },
  { id: 'MEM-14', name: 'Phúc Vương', displayName: 'Phúc Vương', email: 'phuc.vuong@company.vn', initials: 'PV', gradient: 'linear-gradient(135deg,#06b6d4,#0e7490)', roles: ['Backend Developer'], taskCount: 21, workload: 92, status: 'Overloaded' },
  { id: 'MEM-15', name: 'Quỳnh Lưu', displayName: 'Quỳnh Lưu', email: 'quynh.luu@company.vn', initials: 'QL', gradient: 'linear-gradient(135deg,#ec4899,#9d174d)', roles: ['UI/UX Designer'], taskCount: 9, workload: 48, status: 'Active' },
];

/**
 * Project-specific team member assignments.
 * Subset of allMembers assigned to each project's team_members subcollection.
 */
export const projectTeamAssignments: Record<string, string[]> = {
  // E-Commerce Platform (default) — 8 members
  default: ['MEM-01', 'MEM-02', 'MEM-03', 'MEM-04', 'MEM-05', 'MEM-06', 'MEM-07', 'MEM-08'],
  // HRM System — 5 members
  hrm: ['MEM-02', 'MEM-08', 'MEM-11', 'MEM-12', 'MEM-13'],
  // Mobile Banking App — 10 members
  ebanking: ['MEM-01', 'MEM-04', 'MEM-06', 'MEM-07', 'MEM-09', 'MEM-10', 'MEM-11', 'MEM-14', 'MEM-15', 'MEM-03'],
};

/**
 * Legacy alias — used by existing seedTeamMembers() for active project's team_members.
 */
export const teamMembers: TeamMember[] = allMembers.slice(0, 8).map((m) => ({ ...m, id: m.id }));
