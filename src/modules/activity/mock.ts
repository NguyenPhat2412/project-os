/**
 * mock.ts — Activity module
 * ───────────────────────
 * Mock data for activity feed and notifications.
 */

import type { ActivityEntry, Notification } from '@/modules/activity/types/activity';

export const activityFeed: ActivityEntry[] = [
  { id: "AF-01", avatar: { initials: "BT", color: "#22c55e" }, content: "Merge PR #147 — Backend: VNPAY Integration Service", time: "15 phút trước", badge: "Merged", badgeVariant: "accent" },
  { id: "AF-02", avatar: { initials: "AN", color: "#6c63ff" }, content: "Tạo task mới FE-012: Trang xác nhận đơn hàng trong Sprint 08", time: "1 giờ trước", badge: "New Task", badgeVariant: "muted" },
  { id: "AF-03", avatar: { initials: "FN", color: "#a855f7" }, content: "Cập nhật test case QA-005 — thêm 12 test scenario cho checkout", time: "2 giờ trước", badge: "Updated", badgeVariant: "yellow" },
  { id: "AF-04", avatar: { initials: "GP", color: "#f97316" }, content: "Deploy v2.5.0-rc lên môi trường Staging thành công", time: "3 giờ trước", badge: "Deployed", badgeVariant: "green" },
  { id: "AF-05", avatar: { initials: "EV", color: "#06b6d4" }, content: "Upload mockup mới Checkout Flow v3 lên Figma", time: "4 giờ trước" },
  { id: "AF-06", avatar: { initials: "HD", color: "#14b8a6" }, content: "Cập nhật SRS v2.3 — bổ sung yêu cầu module báo cáo Bán hàng", time: "5 giờ trước", badge: "Doc Updated", badgeVariant: "muted" },
];

export const notifications: Notification[] = [
  { id: "N-01", icon: "bell", content: "Sprint Planning S-09 sẽ diễn ra vào 09:00 ngày mai", time: "Vừa xong", unread: true },
  { id: "N-02", icon: "alert-triangle", content: "Bug B-023 (Critical) chưa được assign deadline", time: "1 giờ trước", unread: true },
  { id: "N-03", icon: "check-circle", content: "PR #147 đã được merge vào main branch", time: "2 giờ trước", unread: true },
  { id: "N-04", icon: "bar-chart-2", content: "Báo cáo tuần sprint 08 đã sẵn sàng để review", time: "Hôm qua", unread: false },
  { id: "N-05", icon: "rocket", content: "v2.5.0-rc đã deploy thành công lên staging", time: "3 giờ trước", unread: false },
];
