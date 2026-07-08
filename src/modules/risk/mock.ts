/**
 * mock.ts — Risk module
 * ───────────────────────
 * Mock data for risks.
 */

import type { Risk } from '@/modules/risk/types/risk';

export const risks: Risk[] = [
  { id: "R-001", level: "Critical", description: "Tích hợp VNPAY bị delay do thiếu tài liệu kỹ thuật", mitigation: "Liên hệ trực tiếp technical support VNPAY, escalate lên ban lãnh đạo", ownerId: "TM-02", status: "Đang xử lý", dueDate: "15/03/2026" },
  { id: "R-002", level: "Critical", description: "Key developer (Backend Lead) có thể nghỉ việc", mitigation: "Tăng lương, ghi lại knowledge base, chuẩn bị nhân sự dự phòng", ownerId: "TM-01", status: "Đang theo dõi" },
  { id: "R-003", level: "High", description: "Performance database kém khi dữ liệu sản phẩm lớn (>100k records)", mitigation: "Thêm index, caching Redis, phân trang ở backend", ownerId: "TM-02", status: "Đang xử lý", dueDate: "20/03/2026" },
  { id: "R-004", level: "High", description: "Scope creep từ stakeholder thêm tính năng giữa sprint", mitigation: "Change request process, product backlog grooming định kỳ", ownerId: "TM-01", status: "Đã giảm thiểu" },
  { id: "R-005", level: "Medium", description: "Phụ thuộc vào API bên thứ 3 (shipping, notification)", mitigation: "Xây dựng adapter pattern, fallback mechanism", ownerId: "TM-01", status: "Đã giảm thiểu" },
  { id: "R-006", level: "Low", description: "Lỗi minor UI trên trình duyệt Safari iOS", mitigation: "Cross-browser testing, polyfill cho Safari", ownerId: "TM-03", status: "Đang xử lý", dueDate: "25/03/2026" },
];
