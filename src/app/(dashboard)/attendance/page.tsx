'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { useEmployees, useOrganizations } from '@/lib/api/organizations';
import { useAttendance, useAttendanceMutations } from '@/lib/api/attendance';

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendancePage() {
  const organizations = useOrganizations();
  const [organizationId, setOrganizationId] = useState('');
  const selectedOrganizationId = organizationId || organizations.data?.[0]?.id || '';
  const attendance = useAttendance(selectedOrganizationId || null);
  const employees = useEmployees(selectedOrganizationId || null);
  const actions = useAttendanceMutations(selectedOrganizationId || null);
  const [shiftName, setShiftName] = useState('Giờ hành chính');
  const [scheduleName, setScheduleName] = useState('Lịch tuần');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState(today());
  const [leaveEnd, setLeaveEnd] = useState(today());
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('');
  const selectedEmployeeId = assignmentEmployeeId || employees.data?.[0]?.id || '';

  const run = async (action: () => Promise<unknown>, success: string) => { try { await action(); toast.success(success); } catch (error) { toast.error(error instanceof Error ? error.message : 'Thao tác thất bại'); } };
  const submitShift = (event: FormEvent) => { event.preventDefault(); void run(() => actions.createShift.mutateAsync({ name: shiftName, startTime: '08:00', endTime: '17:00', breakMinutes: 60 }), 'Đã tạo ca làm việc'); };
  const submitSchedule = (event: FormEvent) => { event.preventDefault(); const shift = attendance.shifts.data?.[0]; if (!shift) return toast.error('Hãy tạo ca trước'); void run(() => actions.createSchedule.mutateAsync({ name: scheduleName, slots: [1, 2, 3, 4, 5].map(dayOfWeek => ({ shiftId: shift.id, dayOfWeek })) }), 'Đã tạo lịch tuần'); };
  const submitLeave = (event: FormEvent) => { event.preventDefault(); void run(() => actions.createLeave.mutateAsync({ startDate: leaveStart, endDate: leaveEnd, reason: leaveReason }), 'Đã gửi đơn nghỉ phép'); };
  const submitAdjustment = (event: FormEvent) => { event.preventDefault(); void run(() => actions.createAdjustment.mutateAsync({ workDate: today(), checkInAt: new Date().toISOString(), reason: adjustmentReason }), 'Đã gửi yêu cầu điều chỉnh'); };
  const submitAssignment = (event: FormEvent) => { event.preventDefault(); const schedule = attendance.schedules.data?.[0]; if (!schedule || !selectedEmployeeId) return toast.error('Cần có nhân sự và lịch làm việc'); void run(() => actions.createAssignment.mutateAsync({ employeeId: selectedEmployeeId, scheduleId: schedule.id, effectiveFrom: today() }), 'Đã phân lịch cho nhân sự'); };

  if (organizations.isLoading) return <main className='p-6'>Đang tải tổ chức…</main>;
  if (!organizations.data?.length) return <main className='p-6'>Hãy tạo Organization trước khi dùng chấm công.</main>;
  return <main className='space-y-6 p-6'>
    <header className='flex flex-wrap items-center justify-between gap-3'><div><h1 className='text-2xl font-semibold'>Chấm công</h1><p className='text-sm text-muted-foreground'>Giờ chấm công được lấy từ server.</p></div><select value={selectedOrganizationId} onChange={event => setOrganizationId(event.target.value)} className='rounded border bg-background px-3 py-2'>{organizations.data.map(organization => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></header>
    <section className='flex flex-wrap gap-3 rounded-lg border p-4'><button className='rounded bg-primary px-4 py-2 text-primary-foreground' onClick={() => void run(() => actions.checkIn.mutateAsync(), 'Đã check-in')}>Check-in</button><button className='rounded border px-4 py-2' onClick={() => void run(() => actions.checkOut.mutateAsync(), 'Đã check-out')}>Check-out</button><span className='self-center text-sm text-muted-foreground'>Chỉ tài khoản được liên kết Employee mới có thể chấm công.</span></section>
    <section className='grid gap-6 lg:grid-cols-2'>
      <form className='space-y-3 rounded-lg border p-4' onSubmit={submitShift}><h2 className='font-medium'>Ca làm việc</h2><input value={shiftName} onChange={event => setShiftName(event.target.value)} className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Tạo ca 08:00–17:00</button><ul className='text-sm'>{attendance.shifts.data?.map(shift => <li key={shift.id}>{shift.name}: {shift.startTime}–{shift.endTime}</li>)}</ul></form>
      <form className='space-y-3 rounded-lg border p-4' onSubmit={submitSchedule}><h2 className='font-medium'>Lịch làm việc</h2><input value={scheduleName} onChange={event => setScheduleName(event.target.value)} className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Tạo lịch Thứ 2–Thứ 6</button><ul className='text-sm'>{attendance.schedules.data?.map(schedule => <li key={schedule.id}>{schedule.name} · {schedule.slots.length} ngày</li>)}</ul></form>
    </section>
    <form className='flex flex-wrap items-center gap-3 rounded-lg border p-4' onSubmit={submitAssignment}><h2 className='font-medium'>Phân lịch</h2><select value={selectedEmployeeId} onChange={event => setAssignmentEmployeeId(event.target.value)} className='rounded border bg-background p-2'>{employees.data?.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select><button className='rounded border px-3 py-2'>Gán lịch đầu tiên từ hôm nay</button><span className='text-sm text-muted-foreground'>{attendance.assignments.data?.length ?? 0} phân lịch</span></form>
    <section className='rounded-lg border p-4'><h2 className='mb-3 font-medium'>Timesheet và báo cáo</h2><p className='mb-3 text-sm text-muted-foreground'>Tháng {attendance.monthlyReport.data?.month ?? '—'}: {attendance.monthlyReport.data?.presentDays ?? 0} ngày có mặt · {attendance.monthlyReport.data?.actualMinutes ?? 0} phút công.</p><div className='overflow-x-auto'><table className='w-full text-sm'><thead><tr className='text-left text-muted-foreground'><th>Ngày</th><th>Ca</th><th>Vào</th><th>Ra</th><th>Phút công</th></tr></thead><tbody>{attendance.timesheet.data?.map(row => <tr key={row.recordId} className='border-t'><td className='py-2'>{row.workDate}</td><td>{row.shiftName}</td><td>{row.checkInAt ? new Date(row.checkInAt).toLocaleString() : '—'}</td><td>{row.checkOutAt ? new Date(row.checkOutAt).toLocaleString() : '—'}</td><td>{row.actualMinutes}</td></tr>)}</tbody></table></div></section>
    <section className='grid gap-6 lg:grid-cols-2'>
      <form className='space-y-3 rounded-lg border p-4' onSubmit={submitAdjustment}><h2 className='font-medium'>Điều chỉnh chấm công</h2><input value={adjustmentReason} onChange={event => setAdjustmentReason(event.target.value)} placeholder='Lý do' className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Gửi điều chỉnh hôm nay</button><RequestList items={attendance.adjustments.data ?? []} onApprove={id => run(() => actions.decideAdjustment.mutateAsync({ id, decision: 'approve' }), 'Đã duyệt điều chỉnh')} onReject={id => run(() => actions.decideAdjustment.mutateAsync({ id, decision: 'reject' }), 'Đã từ chối điều chỉnh')} /></form>
      <form className='space-y-3 rounded-lg border p-4' onSubmit={submitLeave}><h2 className='font-medium'>Nghỉ phép</h2><div className='grid grid-cols-2 gap-2'><input type='date' value={leaveStart} onChange={event => setLeaveStart(event.target.value)} className='rounded border bg-background p-2' required /><input type='date' value={leaveEnd} onChange={event => setLeaveEnd(event.target.value)} className='rounded border bg-background p-2' required /></div><input value={leaveReason} onChange={event => setLeaveReason(event.target.value)} placeholder='Lý do' className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Gửi đơn nghỉ</button><RequestList items={attendance.leaves.data ?? []} onApprove={id => run(() => actions.decideLeave.mutateAsync({ id, decision: 'approve' }), 'Đã duyệt đơn nghỉ')} onReject={id => run(() => actions.decideLeave.mutateAsync({ id, decision: 'reject' }), 'Đã từ chối đơn nghỉ')} /></form>
    </section>
  </main>;
}

function RequestList({ items, onApprove, onReject }: { items: { id: string; status: string; reason: string }[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return <ul className='space-y-2 text-sm'>{items.map(item => <li key={item.id} className='flex items-center justify-between gap-2 border-t pt-2'><span>{item.reason} · {item.status}</span>{item.status === 'pending' && <span className='flex gap-1'><button type='button' className='rounded border px-2 py-1' onClick={() => onApprove(item.id)}>Duyệt</button><button type='button' className='rounded border px-2 py-1' onClick={() => onReject(item.id)}>Từ chối</button></span>}</li>)}</ul>;
}
