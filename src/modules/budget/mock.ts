/**
 * mock.ts — Budget module
 * ───────────────────────
 * Mock data for budget.
 */

import type { BudgetItem, ExpenseEntry } from '@/modules/budget/types/budget';

export const budgetItems: BudgetItem[] = [
  { id: "BI-01", category: "Nhân sự (Lương)", icon: "👥", spent: 720000000, budget: 1680000000 },
  { id: "BI-02", category: "Phần mềm & License", icon: "💻", spent: 85000000, budget: 120000000 },
  { id: "BI-03", category: "Cloud & Hạ tầng", icon: "☁️", spent: 65000000, budget: 180000000 },
  { id: "BI-04", category: "Marketing & QC", icon: "📣", spent: 45000000, budget: 240000000 },
  { id: "BI-05", category: "Đào tạo", icon: "📚", spent: 25000000, budget: 60000000 },
  { id: "BI-06", category: "Chi phí phát sinh", icon: "🔧", spent: 40000000, budget: 120000000 },
];

export const expenses: ExpenseEntry[] = [
  { id: "EX-01", date: "05/03/2026", category: "Cloud", description: "AWS EC2 + RDS — tháng 3/2026", amount: 18500000, approverId: "TM-07", status: "Paid" },
  { id: "EX-02", date: "04/03/2026", category: "License", description: "JetBrains All Products Pack — 8 seats", amount: 24000000, approverId: "TM-01", status: "Paid" },
  { id: "EX-03", date: "02/03/2026", category: "Marketing", description: "Thiết kế banner quảng cáo sản phẩm", amount: 15000000, approverId: "TM-08", status: "Pending" },
  { id: "EX-04", date: "28/02/2026", category: "Nhân sự", description: "Phụ cấp OT tháng 2/2026", amount: 32000000, approverId: "TM-01", status: "Paid" },
  { id: "EX-05", date: "25/02/2026", category: "Đào tạo", description: "Khóa AWS Solutions Architect — 2 người", amount: 12000000, approverId: "TM-07", status: "Paid" },
];
