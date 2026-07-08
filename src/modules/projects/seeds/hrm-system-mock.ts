/**
 * hrm-system-mock.ts
 * Mock data cho project HRM System (projectId: 'hrm-system')
 */

import type { TeamMember } from '@/modules/team/types/team';
import type { Sprint } from '@/modules/sprint/types/sprint';
import type { Task } from '@/modules/tasks/types/task';
import type { Bug } from '@/modules/bugs/types/bug';
import type { Risk } from '@/modules/risk/types/risk';
import type { Epic } from '@/modules/backlog/types/backlog';

export const hrmTeam: TeamMember[] = [
  { id: 'HRM-TM-01', name: 'Lan Nguyễn', displayName: 'Lan Nguyễn', email: 'lan.nguyen@hrm.vn', initials: 'LN', gradient: 'linear-gradient(135deg,#6c63ff,#a855f7)', roles: ['HR Manager'], taskCount: 5, workload: 60, status: 'Active' },
  { id: 'HRM-TM-02', name: 'Minh Trần', displayName: 'Minh Trần', email: 'minh.tran@hrm.vn', initials: 'MT', gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', roles: ['Backend Developer'], taskCount: 8, workload: 90, status: 'Overloaded' },
  { id: 'HRM-TM-03', name: 'Huy Lê', displayName: 'Huy Lê', email: 'huy.le@hrm.vn', initials: 'HL', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', roles: ['Frontend Developer'], taskCount: 6, workload: 75, status: 'Active' },
  { id: 'HRM-TM-04', name: 'Thu Phạm', displayName: 'Thu Phạm', email: 'thu.pham@hrm.vn', initials: 'TP', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', roles: ['Business Analyst'], taskCount: 4, workload: 55, status: 'Active' },
  { id: 'HRM-TM-05', name: 'Nam Đỗ', displayName: 'Nam Đỗ', email: 'nam.do@hrm.vn', initials: 'ND', gradient: 'linear-gradient(135deg,#ec4899,#be185d)', roles: ['QA Engineer'], taskCount: 7, workload: 70, status: 'Busy' },
];

export const hrmSprints: (Omit<Sprint, 'id'> & { id: string })[] = [
  { id: 'HRM-SPRINT-01', name: 'Sprint 01', startDate: '2026-01-05', endDate: '2026-01-18', goal: 'Xây dựng module quản lý thông tin nhân viên cơ bản và phân quyền hệ thống.', status: 'completed', order: 1 },
  { id: 'HRM-SPRINT-02', name: 'Sprint 02', startDate: '2026-01-19', endDate: '2026-02-01', goal: 'Hoàn thiện module chấm công và tích hợp máy quét vân tay.', status: 'completed', order: 2 },
  { id: 'HRM-SPRINT-03', name: 'Sprint 03', startDate: '2026-02-02', endDate: '2026-02-15', goal: 'Xây dựng module tính lương tự động và tính năng đề xuất nghỉ phép.', status: 'active', order: 3 },
];

export const hrmTasks: Task[] = [
  { id: 'HRM-TASK-01', title: 'Thiết kế luồng onboarding nhân viên mới', priority: 'High', status: 'done', sprintId: 'HRM-SPRINT-03', description: 'Xây dựng wizard 5 bước: thông tin cá nhân, hợp đồng, tài khoản hệ thống, thiết bị, welcome email.', assigneeId: 'HRM-TM-04', deadline: '05/02/2026', points: 5, order: 0, createdAt: new Date('2026-02-02'), updatedAt: new Date('2026-02-05') },
  { id: 'HRM-TASK-02', title: 'Module tính lương tháng tự động', priority: 'High', status: 'in-progress', sprintId: 'HRM-SPRINT-03', description: 'Tính lương gross/net, khấu trừ bảo hiểm (BHXH, BHYT, BHTN), thuế TNCN theo biểu lũy tiến.', assigneeId: 'HRM-TM-02', deadline: '14/02/2026', points: 13, order: 1, createdAt: new Date('2026-02-02'), updatedAt: new Date('2026-02-08') },
  { id: 'HRM-TASK-03', title: 'Dashboard chấm công realtime', priority: 'Normal', status: 'in-progress', sprintId: 'HRM-SPRINT-03', description: 'Bảng điều khiển hiển thị trạng thái check-in/check-out của toàn bộ nhân viên theo ngày, phòng ban.', assigneeId: 'HRM-TM-03', deadline: '12/02/2026', points: 5, order: 2, createdAt: new Date('2026-02-03'), updatedAt: new Date('2026-02-09') },
  { id: 'HRM-TASK-04', title: 'Tính năng đề xuất nghỉ phép online', priority: 'Normal', status: 'review', sprintId: 'HRM-SPRINT-03', description: 'Form đề xuất nghỉ phép: loại phép, ngày bắt đầu/kết thúc, lý do. Luồng duyệt: nhân viên → quản lý → HR.', assigneeId: 'HRM-TM-03', deadline: '10/02/2026', points: 8, order: 3, createdAt: new Date('2026-02-03'), updatedAt: new Date('2026-02-10') },
  { id: 'HRM-TASK-05', title: 'Gửi email payslip tự động cuối tháng', priority: 'Normal', status: 'todo', sprintId: 'HRM-SPRINT-03', description: 'Cronjob vào ngày 25 hàng tháng: generate PDF payslip cá nhân và gửi qua email công ty. Hỗ trợ tên có dấu.', assigneeId: 'HRM-TM-02', deadline: '15/02/2026', points: 5, order: 4, createdAt: new Date('2026-02-04'), updatedAt: new Date('2026-02-04') },
  { id: 'HRM-TASK-06', title: 'API đồng bộ dữ liệu với phần mềm kế toán', priority: 'High', status: 'todo', sprintId: 'HRM-SPRINT-03', description: 'REST API xuất dữ liệu bảng lương sang MISA Accounting: tổng lương, bảo hiểm, thuế theo từng nhân viên.', assigneeId: 'HRM-TM-02', deadline: '15/02/2026', points: 8, order: 5, createdAt: new Date('2026-02-05'), updatedAt: new Date('2026-02-05') },
  { id: 'HRM-TASK-07', title: 'Báo cáo KPI nhân viên theo quý', priority: 'Low', status: 'todo', description: 'Dashboard KPI cá nhân: mục tiêu vs thực tế, điểm đánh giá, so sánh với trung bình phòng ban.', assigneeId: 'HRM-TM-04', points: 8, order: 6, createdAt: new Date('2026-02-06'), updatedAt: new Date('2026-02-06') },
  { id: 'HRM-TASK-08', title: 'Tích hợp máy chấm công vân tay', priority: 'High', status: 'done', sprintId: 'HRM-SPRINT-02', description: 'SDK máy ZKTeco: đọc log điểm danh qua TCP/IP mỗi 5 phút, đồng bộ vào database attendance.', assigneeId: 'HRM-TM-02', deadline: '01/02/2026', points: 13, order: 7, createdAt: new Date('2026-01-20'), updatedAt: new Date('2026-02-01') },
];

export const hrmBugs: Bug[] = [
  { id: 'HRM-BUG-01', title: 'Lỗi tính OT cho nhân viên làm part-time', severity: 'Critical', status: 'open', description: 'Nhân viên part-time làm 6h/ngày bị tính OT sai — hệ thống dùng ngưỡng 8h thay vì ngưỡng hợp đồng.', stepsToReproduce: '1. Tạo nhân viên part-time (6h/ngày)\n2. Nhập 7h làm việc\n3. Xem kết quả tính OT', assigneeId: 'HRM-TM-02', order: 0, reportedAt: '2026-01-28' },
  { id: 'HRM-BUG-02', title: 'Số ngày phép không cập nhật sau khi duyệt', severity: 'High', status: 'in-progress', description: 'Sau khi manager duyệt đơn nghỉ phép, số ngày phép còn lại trong hồ sơ nhân viên không giảm.', stepsToReproduce: '1. Nhân viên gửi đơn nghỉ 2 ngày\n2. Manager duyệt\n3. Kiểm tra số ngày phép', assigneeId: 'HRM-TM-03', order: 1, reportedAt: '2026-02-03' },
  { id: 'HRM-BUG-03', title: 'PDF payslip lỗi ký tự với tên có dấu đặc biệt', severity: 'High', status: 'in-review', description: 'Tên nhân viên có ký tự đặc biệt (ề, ộ, ượ) bị hiển thị thành ??? trên file PDF payslip.', stepsToReproduce: '1. Tạo nhân viên tên "Nguyễn Hữu Nghĩa"\n2. Generate payslip PDF\n3. Mở file PDF', assigneeId: 'HRM-TM-02', order: 2, reportedAt: '2026-01-25' },
  { id: 'HRM-BUG-04', title: 'Sync máy chấm công delay 15 phút', severity: 'Medium', status: 'open', description: 'Log chấm công từ máy ZKTeco hiển thị trên hệ thống chậm hơn thực tế 15 phút thay vì 5 phút như cấu hình.', stepsToReproduce: '1. Chấm công trên máy\n2. Kiểm tra hệ thống ngay sau\n3. Chờ 10 phút kiểm tra lại', assigneeId: 'HRM-TM-02', order: 3, reportedAt: '2026-02-01' },
  { id: 'HRM-BUG-05', title: 'Email thông báo đánh giá KPI không được gửi', severity: 'Medium', status: 'fixed', description: 'Khi kỳ đánh giá quý mở, nhân viên không nhận được email thông báo tham gia đánh giá.', stepsToReproduce: '1. Mở kỳ đánh giá quý\n2. Kiểm tra inbox nhân viên', assigneeId: 'HRM-TM-02', order: 4, reportedAt: '2026-01-15', resolvedAt: '2026-01-22' },
  { id: 'HRM-BUG-06', title: 'Date picker vỡ layout trên Safari iOS', severity: 'Low', status: 'open', description: 'Trên Safari iOS 17, date picker native không khớp style với form, button "Đặt ngày" bị đẩy ra ngoài viewport.', stepsToReproduce: '1. Mở form đăng ký nghỉ phép trên iPhone Safari\n2. Chọn ngày bắt đầu', assigneeId: 'HRM-TM-03', order: 5, reportedAt: '2026-02-05' },
];

export const hrmRisks: Risk[] = [
  { id: 'HRM-R-01', level: 'Critical', description: 'Dữ liệu lương và thông tin cá nhân nhân viên không đạt chuẩn bảo mật PDPA 2024', mitigation: 'Mã hóa AES-256 tại rest và transit, audit log mọi truy cập dữ liệu nhạy cảm, DPO review hàng tháng', ownerId: 'HRM-TM-01', status: 'Đang xử lý', dueDate: '28/02/2026' },
  { id: 'HRM-R-02', level: 'High', description: 'Tích hợp hệ thống HR cũ (Oracle HCM) phức tạp hơn dự kiến, có thể delay 3-4 tuần', mitigation: 'Thuê Oracle consultant, xây dựng middleware adapter, fallback về import CSV thủ công', ownerId: 'HRM-TM-02', status: 'Đang theo dõi' },
  { id: 'HRM-R-03', level: 'High', description: 'Nhà cung cấp máy chấm công ZKTeco ngừng hỗ trợ SDK phiên bản cũ', mitigation: 'Đánh giá SDK v2, lập kế hoạch nâng cấp, test tương thích trước Q3', ownerId: 'HRM-TM-02', status: 'Đang theo dõi', dueDate: '15/03/2026' },
  { id: 'HRM-R-04', level: 'Medium', description: 'Nhân viên không chấp nhận hệ thống mới, tiếp tục dùng Excel/giấy tờ song song', mitigation: 'Change management: training, roadshow, chỉ định HR champion mỗi phòng ban', ownerId: 'HRM-TM-01', status: 'Đã giảm thiểu' },
];

export const hrmEpics: Epic[] = [
  {
    id: 'HRM-EP-01', name: 'Quản lý thông tin nhân viên', icon: '👤', priority: 'High', status: 'In Progress',
    startDate: '05/01/2026', dueDate: '31/03/2026',
    description: 'Hồ sơ nhân viên đầy đủ: thông tin cá nhân, hợp đồng, lịch sử công tác và luồng onboarding/offboarding.',
    goals: 'HR quản lý toàn bộ vòng đời nhân viên từ ngày đầu đến ngày cuối mà không cần Excel.',
    itemCount: 4, storyPoints: 26,
    items: [
      { id: 'HRM-US-001', label: 'CRUD hồ sơ nhân viên', status: 'Done', priority: 'High', points: 8, startDate: '05/01/2026', dueDate: '18/01/2026', assigneeId: 'HRM-TM-03', description: 'Form tạo/sửa/xem hồ sơ: thông tin cá nhân, ảnh đại diện, phòng ban, chức vụ, hợp đồng.', goals: 'HR tạo hồ sơ mới trong dưới 5 phút.' },
      { id: 'HRM-US-002', label: 'Phân quyền theo vai trò (RBAC)', status: 'Done', priority: 'High', points: 8, startDate: '15/01/2026', dueDate: '28/01/2026', assigneeId: 'HRM-TM-02', description: 'Roles: Admin HR, Manager, Employee. Mỗi role chỉ xem/sửa dữ liệu trong phạm vi quyền.', goals: 'Nhân viên không thể xem lương đồng nghiệp.' },
      { id: 'HRM-US-003', label: 'Luồng onboarding nhân viên mới', status: 'Done', priority: 'Normal', points: 5, startDate: '02/02/2026', dueDate: '10/02/2026', assigneeId: 'HRM-TM-04', description: 'Wizard 5 bước tự động tạo tài khoản, gán thiết bị, gửi welcome email.', goals: 'Rút ngắn thời gian onboarding từ 2 ngày xuống 2 giờ.' },
      { id: 'HRM-US-004', label: 'Tìm kiếm và lọc nhân viên', status: 'In Progress', priority: 'Normal', points: 5, startDate: '10/02/2026', dueDate: '20/02/2026', assigneeId: 'HRM-TM-03', description: 'Full-text search tên, lọc theo phòng ban, chức vụ, trạng thái hợp đồng.', goals: 'HR tìm được nhân viên trong dưới 10 giây.' },
    ],
  },
  {
    id: 'HRM-EP-02', name: 'Lương & Phúc lợi', icon: '💰', priority: 'High', status: 'In Progress',
    startDate: '02/02/2026', dueDate: '30/04/2026',
    description: 'Tự động tính lương gross/net, khấu trừ bảo hiểm và thuế TNCN, xuất payslip PDF và đồng bộ kế toán.',
    goals: 'Toàn bộ bảng lương tháng được xử lý trong 1 ngày, không cần tính tay.',
    itemCount: 4, storyPoints: 34,
    items: [
      { id: 'HRM-US-005', label: 'Tính lương tự động (gross/net)', status: 'In Progress', priority: 'High', points: 13, startDate: '02/02/2026', dueDate: '20/02/2026', assigneeId: 'HRM-TM-02', description: 'Engine tính lương: lương cơ bản + phụ cấp + OT - BHXH/BHYT/BHTN - thuế TNCN lũy tiến.', goals: 'Sai số ≤ 0 đồng so với tính tay theo quy định.' },
      { id: 'HRM-US-006', label: 'Generate và gửi payslip PDF', status: 'Todo', priority: 'High', points: 5, startDate: '20/02/2026', dueDate: '05/03/2026', assigneeId: 'HRM-TM-02', description: 'PDF payslip cá nhân hóa, hỗ trợ Unicode đầy đủ, gửi qua email công ty ngày 25.', goals: 'Nhân viên nhận payslip đúng hạn, mọi ký tự hiển thị đúng.' },
      { id: 'HRM-US-007', label: 'Quản lý phụ cấp và thưởng', status: 'Todo', priority: 'Normal', points: 8, startDate: '05/03/2026', dueDate: '25/03/2026', assigneeId: 'HRM-TM-03', description: 'Admin cấu hình các loại phụ cấp (ăn trưa, xăng xe, điện thoại) và thưởng theo tháng.', goals: 'Thêm loại phụ cấp mới không cần thay đổi code.' },
      { id: 'HRM-US-008', label: 'Xuất báo cáo bảng lương', status: 'Todo', priority: 'Normal', points: 8, startDate: '25/03/2026', dueDate: '15/04/2026', assigneeId: 'HRM-TM-02', description: 'Export Excel bảng lương tháng theo phòng ban, tổng chi phí nhân sự, API đồng bộ MISA.', goals: 'Kế toán nhận file đúng format trong 5 phút sau khi yêu cầu.' },
    ],
  },
  {
    id: 'HRM-EP-03', name: 'Nghỉ phép & Chấm công', icon: '📅', priority: 'Normal', status: 'In Progress',
    startDate: '19/01/2026', dueDate: '28/02/2026',
    description: 'Tích hợp máy chấm công, theo dõi giờ làm, quản lý đơn nghỉ phép và tính OT tự động.',
    goals: 'Loại bỏ hoàn toàn việc chấm công thủ công bằng giấy tờ.',
    itemCount: 3, storyPoints: 26,
    items: [
      { id: 'HRM-US-009', label: 'Tích hợp máy chấm công ZKTeco', status: 'Done', priority: 'High', points: 13, startDate: '19/01/2026', dueDate: '01/02/2026', assigneeId: 'HRM-TM-02', description: 'SDK TCP/IP đọc log vân tay mỗi 5 phút, sync attendance database.', goals: 'Dữ liệu chấm công tự động 100%, không cần nhập tay.' },
      { id: 'HRM-US-010', label: 'Đề xuất và duyệt nghỉ phép online', status: 'In Progress', priority: 'High', points: 8, startDate: '02/02/2026', dueDate: '15/02/2026', assigneeId: 'HRM-TM-03', description: 'Form đề xuất → luồng duyệt 2 cấp → tự động cập nhật số ngày phép còn lại.', goals: 'Đơn nghỉ phép được duyệt trong 24h.' },
      { id: 'HRM-US-011', label: 'Tính và thanh toán OT tự động', status: 'Todo', priority: 'Normal', points: 5, startDate: '15/02/2026', dueDate: '28/02/2026', assigneeId: 'HRM-TM-02', description: 'Tự động phát hiện OT từ dữ liệu chấm công, tính theo quy định 150%/200%, đưa vào bảng lương.', goals: 'Không có khiếu nại về OT tính sai.' },
    ],
  },
  {
    id: 'HRM-EP-04', name: 'Đánh giá hiệu suất', icon: '⭐', priority: 'Low', status: 'Planning',
    startDate: '01/03/2026', dueDate: '30/06/2026',
    description: 'Hệ thống đánh giá KPI theo kỳ (quý/năm), tự đánh giá, đánh giá 360 độ và kết nối với lương thưởng.',
    goals: 'Quy trình đánh giá minh bạch, tự động và kết nối với quyết định lương thưởng.',
    itemCount: 3, storyPoints: 21,
    items: [
      { id: 'HRM-US-012', label: 'Thiết lập mục tiêu KPI theo kỳ', status: 'Todo', priority: 'Normal', points: 8, startDate: '01/03/2026', dueDate: '25/03/2026', assigneeId: 'HRM-TM-04', description: 'HR/Manager tạo template KPI theo chức vụ, nhân viên tự đặt mục tiêu cá nhân.', goals: 'Mỗi nhân viên có KPI rõ ràng trước khi bắt đầu kỳ.' },
      { id: 'HRM-US-013', label: 'Đánh giá 360 độ', status: 'Todo', priority: 'Normal', points: 8, startDate: '25/03/2026', dueDate: '25/04/2026', assigneeId: 'HRM-TM-03', description: 'Nhân viên tự đánh giá + manager đánh giá + peer review, tổng hợp điểm trung bình.', goals: 'Đánh giá khách quan hơn, giảm thiên vị từ một phía.' },
      { id: 'HRM-US-014', label: 'Dashboard KPI cá nhân', status: 'Todo', priority: 'Low', points: 5, startDate: '01/05/2026', dueDate: '31/05/2026', assigneeId: 'HRM-TM-03', description: 'Chart mục tiêu vs thực tế, so sánh với trung bình phòng ban, lịch sử các kỳ.', goals: 'Nhân viên tự theo dõi tiến độ KPI mà không cần hỏi HR.' },
    ],
  },
];
