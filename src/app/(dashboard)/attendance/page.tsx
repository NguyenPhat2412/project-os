'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { useAttendance, useAttendanceMutations, useAttendanceScope, type MonthlyReport } from '@/lib/api/attendance';
import { useEmployees, useOrganizations, type Employee } from '@/lib/api/organizations';

const today = () => new Date().toISOString().slice(0, 10);
const hours = (minutes = 0) => `${(minutes / 60).toFixed(1)} giờ`;
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '—';
const statusLabel: Record<string, string> = { open: 'Đang làm', completed: 'Hoàn tất', pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };

export default function AttendancePage() {
  const organizations = useOrganizations();
  const [organizationId, setOrganizationId] = useState('');
  const selectedOrganizationId = organizationId || organizations.data?.[0]?.id || '';
  const scope = useAttendanceScope(selectedOrganizationId || null);
  const employees = useEmployees(selectedOrganizationId || null);
  const actions = useAttendanceMutations(selectedOrganizationId || null);
  const [reportEmployeeId, setReportEmployeeId] = useState('');
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('');
  const [shiftName, setShiftName] = useState('Giờ hành chính');
  const [scheduleName, setScheduleName] = useState('Lịch tuần');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStart, setLeaveStart] = useState(today());
  const [leaveEnd, setLeaveEnd] = useState(today());
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const ownEmployeeId = scope.data?.employeeId ?? '';
  const organizationAdmin = scope.data?.organizationAdmin ?? false;
  const visibleEmployees = useMemo(() => {
    const active = (employees.data ?? []).filter(employee => employee.status === 'active');
    if (organizationAdmin) return active;
    return active.filter(employee => employee.id === ownEmployeeId || employee.supervisorId === ownEmployeeId);
  }, [employees.data, organizationAdmin, ownEmployeeId]);
  const selectedReportEmployeeId = visibleEmployees.some(employee => employee.id === reportEmployeeId)
    ? reportEmployeeId
    : ownEmployeeId || visibleEmployees[0]?.id || '';
  const selectedEmployee = visibleEmployees.find(employee => employee.id === selectedReportEmployeeId);
  const canSelectEmployee = organizationAdmin || visibleEmployees.length > 1;
  const attendance = useAttendance(selectedOrganizationId || null, selectedReportEmployeeId || null, organizationAdmin);
  const selectedAssignmentEmployeeId = assignmentEmployeeId || employees.data?.[0]?.id || '';

  const run = async (action: () => Promise<unknown>, success: string) => {
    try { await action(); toast.success(success); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Thao tác thất bại'); }
  };
  const submitShift = (event: FormEvent) => { event.preventDefault(); void run(() => actions.createShift.mutateAsync({ name: shiftName, startTime: '08:00', endTime: '17:00', breakMinutes: 60 }), 'Đã tạo ca làm việc'); };
  const submitSchedule = (event: FormEvent) => { event.preventDefault(); const shift = attendance.shifts.data?.[0]; if (!shift) return toast.error('Hãy tạo ca trước'); void run(() => actions.createSchedule.mutateAsync({ name: scheduleName, slots: [1, 2, 3, 4, 5].map(dayOfWeek => ({ shiftId: shift.id, dayOfWeek })) }), 'Đã tạo lịch tuần'); };
  const submitLeave = (event: FormEvent) => { event.preventDefault(); void run(() => actions.createLeave.mutateAsync({ startDate: leaveStart, endDate: leaveEnd, reason: leaveReason }), 'Đã gửi đơn nghỉ phép'); };
  const submitAdjustment = (event: FormEvent) => { event.preventDefault(); void run(() => actions.createAdjustment.mutateAsync({ workDate: today(), checkInAt: new Date().toISOString(), reason: adjustmentReason }), 'Đã gửi yêu cầu điều chỉnh'); };
  const submitAssignment = (event: FormEvent) => { event.preventDefault(); const schedule = attendance.schedules.data?.[0]; if (!schedule || !selectedAssignmentEmployeeId) return toast.error('Cần có nhân sự và lịch làm việc'); void run(() => actions.createAssignment.mutateAsync({ employeeId: selectedAssignmentEmployeeId, scheduleId: schedule.id, effectiveFrom: today() }), 'Đã phân lịch cho nhân sự'); };

  if (organizations.isLoading) return <main className='p-6'>Đang tải tổ chức…</main>;
  if (!organizations.data?.length) return <main className='p-6'>Hãy tạo Organization trước khi dùng chấm công.</main>;

  return <main className='space-y-6 p-6'>
    <header className='flex flex-wrap items-center justify-between gap-3'>
      <div><h1 className='text-2xl font-semibold'>Chấm công</h1><p className='text-sm text-muted-foreground'>Giờ chấm công được lấy từ server; dữ liệu cá nhân được giới hạn theo quyền.</p></div>
      <select value={selectedOrganizationId} onChange={event => { setOrganizationId(event.target.value); setReportEmployeeId(''); }} className='rounded border bg-background px-3 py-2'>{organizations.data.map(organization => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select>
    </header>

    {ownEmployeeId && <section className='flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4'>
      <div className='mr-auto'><h2 className='font-medium'>Chấm công của tôi</h2><p className='text-sm text-muted-foreground'>Bạn chỉ có thể check-in/check-out cho chính mình.</p></div>
      <button className='rounded bg-primary px-4 py-2 text-primary-foreground' onClick={() => void run(() => actions.checkIn.mutateAsync(), 'Đã check-in')}>Check-in</button>
      <button className='rounded border px-4 py-2' onClick={() => void run(() => actions.checkOut.mutateAsync(), 'Đã check-out')}>Check-out</button>
    </section>}

    <section className={canSelectEmployee ? 'grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]' : ''}>
      {canSelectEmployee && <aside className='h-fit rounded-lg border bg-card p-3'>
        <h2 className='mb-1 px-2 font-medium'>Bảng công nhân sự</h2>
        <p className='mb-3 px-2 text-xs text-muted-foreground'>{organizationAdmin ? 'Toàn bộ nhân sự' : 'Bạn và nhân sự trực tiếp'}</p>
        <div className='max-h-80 space-y-1 overflow-y-auto'>{visibleEmployees.map(employee => <EmployeeButton key={employee.id} employee={employee} active={employee.id === selectedReportEmployeeId} onClick={() => setReportEmployeeId(employee.id)} />)}</div>
      </aside>}
      <AttendanceReport employee={selectedEmployee} report={attendance.monthlyReport.data} loading={attendance.monthlyReport.isLoading} />
    </section>

    {organizationAdmin && <>
      <section className='grid gap-6 lg:grid-cols-2'>
        <form className='space-y-3 rounded-lg border p-4' onSubmit={submitShift}><h2 className='font-medium'>Ca làm việc</h2><input value={shiftName} onChange={event => setShiftName(event.target.value)} className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Tạo ca 08:00–17:00</button><ul className='text-sm'>{attendance.shifts.data?.map(shift => <li key={shift.id}>{shift.name}: {shift.startTime}–{shift.endTime}</li>)}</ul></form>
        <form className='space-y-3 rounded-lg border p-4' onSubmit={submitSchedule}><h2 className='font-medium'>Lịch làm việc</h2><input value={scheduleName} onChange={event => setScheduleName(event.target.value)} className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Tạo lịch Thứ 2–Thứ 6</button><ul className='text-sm'>{attendance.schedules.data?.map(schedule => <li key={schedule.id}>{schedule.name} · {schedule.slots.length} ngày</li>)}</ul></form>
      </section>
      <form className='flex flex-wrap items-center gap-3 rounded-lg border p-4' onSubmit={submitAssignment}><h2 className='font-medium'>Phân lịch</h2><select value={selectedAssignmentEmployeeId} onChange={event => setAssignmentEmployeeId(event.target.value)} className='rounded border bg-background p-2'>{employees.data?.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select><button className='rounded border px-3 py-2'>Gán lịch đầu tiên từ hôm nay</button><span className='text-sm text-muted-foreground'>{attendance.assignments.data?.length ?? 0} phân lịch</span></form>
    </>}

    {ownEmployeeId && <section className='grid gap-6 lg:grid-cols-2'>
      <form className='space-y-3 rounded-lg border p-4' onSubmit={submitAdjustment}><h2 className='font-medium'>Điều chỉnh chấm công</h2><input value={adjustmentReason} onChange={event => setAdjustmentReason(event.target.value)} placeholder='Lý do' className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Gửi điều chỉnh hôm nay</button><RequestList items={attendance.adjustments.data ?? []} canReview={organizationAdmin} onApprove={id => run(() => actions.decideAdjustment.mutateAsync({ id, decision: 'approve' }), 'Đã duyệt điều chỉnh')} onReject={id => run(() => actions.decideAdjustment.mutateAsync({ id, decision: 'reject' }), 'Đã từ chối điều chỉnh')} /></form>
      <form className='space-y-3 rounded-lg border p-4' onSubmit={submitLeave}><h2 className='font-medium'>Nghỉ phép</h2><div className='grid grid-cols-2 gap-2'><input type='date' value={leaveStart} onChange={event => setLeaveStart(event.target.value)} className='rounded border bg-background p-2' required /><input type='date' value={leaveEnd} onChange={event => setLeaveEnd(event.target.value)} className='rounded border bg-background p-2' required /></div><input value={leaveReason} onChange={event => setLeaveReason(event.target.value)} placeholder='Lý do' className='w-full rounded border bg-background p-2' required /><button className='rounded border px-3 py-2'>Gửi đơn nghỉ</button><RequestList items={attendance.leaves.data ?? []} canReview={organizationAdmin} onApprove={id => run(() => actions.decideLeave.mutateAsync({ id, decision: 'approve' }), 'Đã duyệt đơn nghỉ')} onReject={id => run(() => actions.decideLeave.mutateAsync({ id, decision: 'reject' }), 'Đã từ chối đơn nghỉ')} /></form>
    </section>}
  </main>;
}

function EmployeeButton({ employee, active, onClick }: { employee: Employee; active: boolean; onClick: () => void }) {
  return <button type='button' onClick={onClick} className={`w-full rounded-md px-3 py-2 text-left transition-colors ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
    <span className='block truncate text-sm font-medium'>{employee.fullName}</span>
    <span className={`block truncate text-xs ${active ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{employee.title || employee.email}</span>
  </button>;
}

function AttendanceReport({ employee, report, loading }: { employee?: Employee; report?: MonthlyReport | null; loading: boolean }) {
  const averageMinutes = report?.recordedDays ? report.actualMinutes / report.recordedDays : 0;
  const chartData = [...(report?.items ?? [])].reverse().slice(-14).map(item => ({ date: item.workDate.slice(5), hours: Number((item.actualMinutes / 60).toFixed(1)) }));
  return <div className='space-y-4 rounded-lg border bg-card p-4'>
    <div><h2 className='text-lg font-semibold'>{employee ? `Bảng công · ${employee.fullName}` : 'Bảng công của tôi'}</h2><p className='text-sm text-muted-foreground'>Tháng {report?.month ?? new Date().toISOString().slice(0, 7)} · chỉ chủ tài khoản và người quản lý được phép xem.</p></div>
    <div className='grid grid-cols-2 gap-3 xl:grid-cols-4'>
      <Metric label='Ngày có mặt' value={String(report?.presentDays ?? 0)} />
      <Metric label='Ngày đã ghi' value={String(report?.recordedDays ?? 0)} />
      <Metric label='Tổng giờ công' value={hours(report?.actualMinutes)} />
      <Metric label='Trung bình/ngày' value={hours(averageMinutes)} />
    </div>
    <div className='rounded-md border p-3'><h3 className='mb-3 text-sm font-medium'>Giờ công theo ngày</h3>{chartData.length ? <ResponsiveContainer width='100%' height={190} initialDimension={{ width: 1, height: 1 }}><BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} /><XAxis dataKey='date' tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} unit='h' /><Tooltip cursor={{ fill: 'var(--muted)' }} /><Bar dataKey='hours' name='Giờ công' fill='var(--chart-1)' radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className='py-12 text-center text-sm text-muted-foreground'>{loading ? 'Đang tải dữ liệu…' : 'Chưa có dữ liệu chấm công trong tháng này.'}</p>}</div>
    <div className='overflow-x-auto'><table className='w-full text-sm'><thead><tr className='text-left text-muted-foreground'><th className='py-2'>Ngày</th><th>Ca</th><th>Vào</th><th>Ra</th><th>Giờ công</th><th>Trạng thái</th></tr></thead><tbody>{report?.items.map(row => <tr key={row.recordId} className='border-t'><td className='py-2'>{row.workDate}</td><td>{row.shiftName}</td><td>{dateTime(row.checkInAt)}</td><td>{dateTime(row.checkOutAt)}</td><td>{hours(row.actualMinutes)}</td><td>{statusLabel[row.status] ?? row.status}</td></tr>)}</tbody></table>{!loading && !report?.items.length && <p className='py-6 text-center text-sm text-muted-foreground'>Không có bản ghi.</p>}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className='rounded-md border bg-background p-3'><p className='text-xs text-muted-foreground'>{label}</p><p className='mt-1 text-xl font-semibold'>{value}</p></div>;
}

function RequestList({ items, canReview, onApprove, onReject }: { items: { id: string; status: string; reason: string }[]; canReview: boolean; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return <ul className='space-y-2 text-sm'>{items.map(item => <li key={item.id} className='flex items-center justify-between gap-2 border-t pt-2'><span>{item.reason} · {statusLabel[item.status] ?? item.status}</span>{canReview && item.status === 'pending' && <span className='flex gap-1'><button type='button' className='rounded border px-2 py-1' onClick={() => onApprove(item.id)}>Duyệt</button><button type='button' className='rounded border px-2 py-1' onClick={() => onReject(item.id)}>Từ chối</button></span>}</li>)}</ul>;
}
