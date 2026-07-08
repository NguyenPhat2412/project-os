/**
 * mobile-banking-mock.ts
 * Mock data cho project Mobile Banking App (projectId: 'mobile-banking')
 */

import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Task } from '@/modules/tasks/types/task';
import type { Bug } from '@/modules/bugs/types/bug';
import type { Risk } from '@/modules/risk/types/risk';
import type { Epic } from '@/modules/backlog/types/backlog';

export const mbTeam: TeamMember[] = [
  { id: 'MB-TM-01', name: 'Khoa Nguyễn', displayName: 'Khoa Nguyễn', email: 'khoa.nguyen@mobilebank.vn', initials: 'KN', gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)', roles: ['Lead iOS Developer'], taskCount: 9, workload: 95, status: 'Overloaded' },
  { id: 'MB-TM-02', name: 'Linh Trần', displayName: 'Linh Trần', email: 'linh.tran@mobilebank.vn', initials: 'LT', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', roles: ['Android Developer'], taskCount: 7, workload: 80, status: 'Busy' },
  { id: 'MB-TM-03', name: 'Tuấn Lê', displayName: 'Tuấn Lê', email: 'tuan.le@mobilebank.vn', initials: 'TL', gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', roles: ['Backend Engineer (Go)'], taskCount: 10, workload: 90, status: 'Overloaded' },
  { id: 'MB-TM-04', name: 'An Phạm', displayName: 'An Phạm', email: 'an.pham@mobilebank.vn', initials: 'AP', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', roles: ['Security Engineer'], taskCount: 5, workload: 65, status: 'Active' },
  { id: 'MB-TM-05', name: 'Ngọc Vũ', displayName: 'Ngọc Vũ', email: 'ngoc.vu@mobilebank.vn', initials: 'NV', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', roles: ['UI/UX Designer'], taskCount: 4, workload: 55, status: 'Active' },
  { id: 'MB-TM-06', name: 'Việt Hoàng', displayName: 'Việt Hoàng', email: 'viet.hoang@mobilebank.vn', initials: 'VH', gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)', roles: ['QA Lead'], taskCount: 6, workload: 70, status: 'Active' },
];

export const mbSprints: (Omit<Sprint, 'id'> & { id: string })[] = [
  { id: 'MB-SPRINT-01', name: 'Sprint 01', startDate: '2026-03-01', endDate: '2026-03-15', goal: 'Xây dựng tính năng xác thực sinh trắc học, màn hình tổng quan tài khoản và chuyển tiền cơ bản.', status: 'active', order: 1 },
  { id: 'MB-SPRINT-02', name: 'Sprint 02', startDate: '2026-03-16', endDate: '2026-03-29', goal: 'Tích hợp thanh toán hóa đơn, luồng KYC và push notification giao dịch.', status: 'planned', order: 2 },
];

export const mbTasks: Task[] = [
  { id: 'MB-TASK-01', title: 'Xác thực sinh trắc học (Face ID / Touch ID)', priority: 'High', status: 'in-progress', sprintId: 'MB-SPRINT-01', description: 'Tích hợp iOS LocalAuthentication và Android BiometricPrompt. Fallback về PIN 6 số khi sinh trắc không khả dụng.', assigneeId: 'MB-TM-01', deadline: '10/03/2026', points: 8, order: 0, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-05') },
  { id: 'MB-TASK-02', title: 'Màn hình tổng quan tài khoản', priority: 'High', status: 'review', sprintId: 'MB-SPRINT-01', description: 'Hiển thị số dư, tên tài khoản (che bớt số), 5 giao dịch gần nhất, shortcut chuyển tiền/nạp tiền.', assigneeId: 'MB-TM-05', deadline: '08/03/2026', points: 5, order: 1, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-07') },
  { id: 'MB-TASK-03', title: 'Chức năng chuyển tiền nội bộ', priority: 'High', status: 'in-progress', sprintId: 'MB-SPRINT-01', description: 'Chuyển tiền giữa các tài khoản cùng ngân hàng: nhập số tài khoản, số tiền, nội dung, xác nhận OTP.', assigneeId: 'MB-TM-03', deadline: '12/03/2026', points: 13, order: 2, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-06') },
  { id: 'MB-TASK-04', title: 'Lịch sử giao dịch với bộ lọc', priority: 'Normal', status: 'todo', sprintId: 'MB-SPRINT-01', description: 'Danh sách giao dịch phân trang 20 items, lọc theo ngày/loại/số tiền, tìm kiếm nội dung.', assigneeId: 'MB-TM-02', deadline: '14/03/2026', points: 5, order: 3, createdAt: new Date('2026-03-02'), updatedAt: new Date('2026-03-02') },
  { id: 'MB-TASK-05', title: 'Push notification cho giao dịch', priority: 'High', status: 'todo', sprintId: 'MB-SPRINT-02', description: 'Firebase FCM: push ngay khi phát sinh giao dịch credit/debit, bao gồm số tiền và số dư còn lại.', assigneeId: 'MB-TM-03', deadline: '22/03/2026', points: 8, order: 4, createdAt: new Date('2026-03-02'), updatedAt: new Date('2026-03-02') },
  { id: 'MB-TASK-06', title: 'Luồng KYC xác minh danh tính', priority: 'High', status: 'todo', sprintId: 'MB-SPRINT-02', description: 'Upload CCCD 2 mặt + selfie, gọi API eKYC (VinAI), chờ duyệt manual nếu confidence score < 90%.', assigneeId: 'MB-TM-04', deadline: '25/03/2026', points: 13, order: 5, createdAt: new Date('2026-03-03'), updatedAt: new Date('2026-03-03') },
  { id: 'MB-TASK-07', title: 'Thanh toán hóa đơn điện-nước-internet', priority: 'Normal', status: 'todo', sprintId: 'MB-SPRINT-02', description: 'Tích hợp VNPT Pay: lookup hóa đơn theo mã KH, hiển thị số tiền, xác nhận và ghi nhận giao dịch.', assigneeId: 'MB-TM-03', deadline: '28/03/2026', points: 8, order: 6, createdAt: new Date('2026-03-04'), updatedAt: new Date('2026-03-04') },
  { id: 'MB-TASK-08', title: 'Chuẩn bị hồ sơ security audit', priority: 'High', status: 'done', sprintId: 'MB-SPRINT-01', description: 'Lập danh sách checklist OWASP Mobile Top 10, threat model, pen test scope cho đội audit NHNN.', assigneeId: 'MB-TM-04', deadline: '05/03/2026', points: 5, order: 7, createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-04') },
];

export const mbBugs: Bug[] = [
  { id: 'MB-BUG-01', title: 'App crash khi bật sinh trắc học trên Android 12', severity: 'Critical', status: 'in-progress', description: 'BiometricPrompt ném NullPointerException trên Android 12 (API 31) khi gọi authenticate(). Android 13+ không bị.', stepsToReproduce: '1. Dùng thiết bị Android 12\n2. Vào Settings → Bật xác thực vân tay\n3. App crash ngay lập tức', assigneeId: 'MB-TM-02', order: 0, reportedAt: '2026-03-06' },
  { id: 'MB-BUG-02', title: 'Không validate số tiền chuyển khoản âm', severity: 'Critical', status: 'open', description: 'Nhập số tiền âm (ví dụ -500000) vào form chuyển tiền, hệ thống backend chấp nhận và tạo giao dịch.', stepsToReproduce: '1. Vào form chuyển tiền\n2. Nhập số tiền: -500000\n3. Submit — giao dịch được tạo', assigneeId: 'MB-TM-03', order: 1, reportedAt: '2026-03-07' },
  { id: 'MB-BUG-03', title: 'Lịch sử giao dịch không load trang thứ 2', severity: 'High', status: 'open', description: 'Trang 1 load bình thường. Khi scroll đến cuối để load trang 2, spinner hiện rồi biến mất, không có thêm data.', stepsToReproduce: '1. Vào lịch sử giao dịch\n2. Scroll xuống cuối trang 1\n3. Không có giao dịch tiếp theo', assigneeId: 'MB-TM-01', order: 2, reportedAt: '2026-03-08' },
  { id: 'MB-BUG-04', title: 'Push token FCM không refresh sau khi logout', severity: 'Medium', status: 'in-review', description: 'Sau khi logout và login lại bằng tài khoản khác, device vẫn nhận notification của tài khoản cũ.', stepsToReproduce: '1. Login tài khoản A\n2. Logout\n3. Login tài khoản B\n4. Tài khoản A nhận notification trên thiết bị', assigneeId: 'MB-TM-03', order: 3, reportedAt: '2026-03-05' },
  { id: 'MB-BUG-05', title: 'Số tài khoản hiển thị đầy đủ trong transaction history', severity: 'High', status: 'fixed', description: 'Màn hình lịch sử giao dịch hiển thị số tài khoản đối ứng đầy đủ thay vì che 6 số giữa (VD: 9704****1234).', stepsToReproduce: '1. Mở lịch sử giao dịch\n2. Xem chi tiết bất kỳ giao dịch\n3. Số tài khoản đối ứng hiển thị đầy đủ', assigneeId: 'MB-TM-01', order: 4, reportedAt: '2026-03-04', resolvedAt: '2026-03-06' },
];

export const mbRisks: Risk[] = [
  { id: 'MB-R-01', level: 'Critical', description: 'Chưa có phê duyệt chính thức từ NHNN cho tính năng chuyển tiền qua mobile — có thể bị yêu cầu dừng', mitigation: 'Làm việc với Legal team, nộp hồ sơ thông báo NHNN trước Q2, chạy pilot với 1000 user đầu tiên', ownerId: 'MB-TM-04', status: 'Đang xử lý', dueDate: '31/03/2026' },
  { id: 'MB-R-02', level: 'Critical', description: 'Lỗ hổng bảo mật trong luồng xác thực OTP: brute force và replay attack chưa được ngăn chặn', mitigation: 'Rate limiting 3 lần/5 phút, OTP expire sau 120 giây, HMAC signature để chống replay', ownerId: 'MB-TM-04', status: 'Đang xử lý', dueDate: '15/03/2026' },
  { id: 'MB-R-03', level: 'High', description: 'Phân mảnh iOS/Android: tính năng sinh trắc học hoạt động khác nhau trên ~50 dòng máy được test', mitigation: 'Test matrix 30 thiết bị phổ biến nhất VN, graceful degradation về PIN khi biometric không ổn định', ownerId: 'MB-TM-01', status: 'Đang theo dõi' },
  { id: 'MB-R-04', level: 'High', description: 'SDK VNPT Pay chưa có tài liệu chính thức cho tính năng thanh toán hóa đơn realtime', mitigation: 'Làm việc trực tiếp với VNPT technical team, xây dựng mock server để dev song song', ownerId: 'MB-TM-03', status: 'Đang theo dõi', dueDate: '20/03/2026' },
  { id: 'MB-R-05', level: 'Medium', description: 'Hiệu năng API chuyển tiền có thể xuống dưới SLA khi >500 concurrent transactions', mitigation: 'Load test với k6, tối ưu DB index, caching balance ở Redis với TTL 30 giây', ownerId: 'MB-TM-03', status: 'Đã giảm thiểu' },
];

export const mbEpics: Epic[] = [
  {
    id: 'MB-EP-01', name: 'Xác thực & Bảo mật', icon: '🔐', priority: 'High', status: 'In Progress',
    startDate: '01/03/2026', dueDate: '31/03/2026',
    description: 'Hệ thống xác thực đa lớp: sinh trắc học, PIN, OTP, và bảo vệ session theo tiêu chuẩn ngân hàng.',
    goals: 'Zero unauthorized access, đáp ứng OWASP Mobile Top 10 và yêu cầu bảo mật NHNN.',
    itemCount: 3, storyPoints: 29,
    items: [
      { id: 'MB-US-001', label: 'Đăng nhập bằng sinh trắc học', status: 'In Progress', priority: 'High', points: 8, startDate: '01/03/2026', dueDate: '12/03/2026', assigneeId: 'MB-TM-01', description: 'Face ID (iOS) và Fingerprint/Face (Android), fallback PIN 6 số.', goals: 'Đăng nhập trong 1 giây với sinh trắc học.' },
      { id: 'MB-US-002', label: 'Xác thực OTP cho giao dịch quan trọng', status: 'In Progress', priority: 'High', points: 8, startDate: '05/03/2026', dueDate: '15/03/2026', assigneeId: 'MB-TM-03', description: 'OTP 6 số qua SMS, expire 120 giây, rate limit 3 lần/5 phút.', goals: 'Mọi giao dịch >500K đều yêu cầu OTP.' },
      { id: 'MB-US-003', label: 'Luồng KYC xác minh danh tính', status: 'Todo', priority: 'High', points: 13, startDate: '16/03/2026', dueDate: '28/03/2026', assigneeId: 'MB-TM-04', description: 'Upload CCCD + selfie, eKYC API, manual review nếu cần.', goals: 'Tỷ lệ auto-approve ≥ 85%, thời gian xử lý ≤ 2 phút.' },
      { id: 'MB-US-004', label: 'Phát hiện và chặn giao dịch bất thường', status: 'Todo', priority: 'Normal', points: 5, startDate: '20/03/2026', dueDate: '31/03/2026', assigneeId: 'MB-TM-04', description: 'Rule-based fraud detection: giao dịch lớn bất thường, đăng nhập từ vị trí mới.', goals: 'Phát hiện ≥ 95% giao dịch gian lận trước khi thực hiện.' },
    ],
  },
  {
    id: 'MB-EP-02', name: 'Quản lý tài khoản', icon: '🏦', priority: 'High', status: 'In Progress',
    startDate: '01/03/2026', dueDate: '15/03/2026',
    description: 'Màn hình tổng quan số dư, thông tin tài khoản, hạn mức giao dịch và quản lý thẻ.',
    goals: 'Khách hàng nắm được tình trạng tài khoản và thẻ trong vòng 3 giây mở app.',
    itemCount: 3, storyPoints: 18,
    items: [
      { id: 'MB-US-005', label: 'Dashboard tổng quan tài khoản', status: 'In Progress', priority: 'High', points: 5, startDate: '01/03/2026', dueDate: '08/03/2026', assigneeId: 'MB-TM-05', description: 'Số dư che một phần, 5 giao dịch gần nhất, shortcut actions.', goals: 'First meaningful paint < 2 giây.' },
      { id: 'MB-US-006', label: 'Quản lý hạn mức giao dịch', status: 'Todo', priority: 'Normal', points: 5, startDate: '08/03/2026', dueDate: '15/03/2026', assigneeId: 'MB-TM-01', description: 'Khách hàng tự điều chỉnh hạn mức chuyển khoản ngày/tháng trong giới hạn ngân hàng cho phép.', goals: 'Khách hàng không cần gọi hotline để thay đổi hạn mức.' },
      { id: 'MB-US-007', label: 'Quản lý và khóa thẻ', status: 'Todo', priority: 'Normal', points: 8, startDate: '10/03/2026', dueDate: '25/03/2026', assigneeId: 'MB-TM-01', description: 'Xem thông tin thẻ (che số), tạm khóa/mở khóa thẻ tức thì, báo mất thẻ.', goals: 'Khóa thẻ khẩn cấp trong vòng 10 giây.' },
    ],
  },
  {
    id: 'MB-EP-03', name: 'Giao dịch & Thanh toán', icon: '💸', priority: 'High', status: 'In Progress',
    startDate: '01/03/2026', dueDate: '30/04/2026',
    description: 'Chuyển tiền nội bộ, liên ngân hàng (Napas), thanh toán QR và hóa đơn tiện ích.',
    goals: 'Giao dịch thành công trong 10 giây, SLA 99.9% uptime.',
    itemCount: 4, storyPoints: 39,
    items: [
      { id: 'MB-US-008', label: 'Chuyển tiền nội bộ', status: 'In Progress', priority: 'High', points: 13, startDate: '01/03/2026', dueDate: '14/03/2026', assigneeId: 'MB-TM-03', description: 'Chuyển tiền cùng ngân hàng tức thì 24/7, confirm bằng OTP.', goals: 'Giao dịch hoàn tất trong 5 giây.' },
      { id: 'MB-US-009', label: 'Chuyển tiền liên ngân hàng (Napas 247)', status: 'Todo', priority: 'High', points: 13, startDate: '14/03/2026', dueDate: '31/03/2026', assigneeId: 'MB-TM-03', description: 'Tích hợp Napas 247, tra cứu tên chủ tài khoản trước khi chuyển.', goals: 'Chuyển liên ngân hàng ≤ 15 giây.' },
      { id: 'MB-US-010', label: 'Thanh toán hóa đơn tiện ích', status: 'Todo', priority: 'Normal', points: 8, startDate: '16/03/2026', dueDate: '29/03/2026', assigneeId: 'MB-TM-03', description: 'Điện, nước, internet qua VNPT Pay — lookup hóa đơn theo mã KH.', goals: 'Thanh toán thành công trong 3 tap.' },
      { id: 'MB-US-011', label: 'Thanh toán QR Code', status: 'Todo', priority: 'Normal', points: 5, startDate: '01/04/2026', dueDate: '20/04/2026', assigneeId: 'MB-TM-02', description: 'Scan QR VietQR tại điểm bán, confirm số tiền và OTP.', goals: 'Quét QR đến confirm trong 30 giây.' },
    ],
  },
  {
    id: 'MB-EP-04', name: 'Thông báo & Cài đặt', icon: '🔔', priority: 'Normal', status: 'Planning',
    startDate: '16/03/2026', dueDate: '30/04/2026',
    description: 'Push notification real-time cho giao dịch, cài đặt app và hỗ trợ đa ngôn ngữ.',
    goals: 'Khách hàng nhận thông báo trong vòng 3 giây sau mỗi giao dịch.',
    itemCount: 3, storyPoints: 18,
    items: [
      { id: 'MB-US-012', label: 'Push notification giao dịch', status: 'Todo', priority: 'High', points: 8, startDate: '16/03/2026', dueDate: '25/03/2026', assigneeId: 'MB-TM-03', description: 'FCM push cho mọi credit/debit: số tiền, số dư mới, nội dung giao dịch.', goals: 'Push đến thiết bị trong ≤ 3 giây.' },
      { id: 'MB-US-013', label: 'Trung tâm thông báo trong app', status: 'Todo', priority: 'Normal', points: 5, startDate: '25/03/2026', dueDate: '05/04/2026', assigneeId: 'MB-TM-02', description: 'Inbox thông báo trong app, đánh dấu đã đọc, lọc theo loại.', goals: 'Khách hàng tra cứu lại thông báo bất kỳ lúc nào.' },
      { id: 'MB-US-014', label: 'Cài đặt ngôn ngữ và giao diện', status: 'Todo', priority: 'Low', points: 5, startDate: '05/04/2026', dueDate: '20/04/2026', assigneeId: 'MB-TM-05', description: 'Hỗ trợ Tiếng Việt và English, chế độ sáng/tối, font size accessibility.', goals: 'Người dùng cảm thấy thoải mái với ngôn ngữ và theme yêu thích.' },
    ],
  },
];
