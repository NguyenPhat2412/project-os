'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface Shift { id: string; name: string; startTime: string; endTime: string; breakMinutes: number; active: boolean; }
export interface Schedule { id: string; name: string; active: boolean; slots: { id: string; shiftId: string; dayOfWeek: number }[]; }
export interface ScheduleAssignment { id: string; employeeId: string; scheduleId: string; effectiveFrom: string; effectiveTo?: string | null; }
export interface AttendanceScope { employeeId?: string | null; organizationAdmin: boolean; }
export interface AttendanceRecord { id: string; employeeId: string; workDate: string; shiftName: string; checkInAt?: string | null; checkOutAt?: string | null; status: string; }
export interface Timesheet { recordId: string; employeeId: string; workDate: string; shiftName: string; checkInAt?: string | null; checkOutAt?: string | null; actualMinutes: number; status: string; }
export interface Adjustment { id: string; workDate: string; reason: string; status: string; }
export interface LeaveRequest { id: string; startDate: string; endDate: string; reason: string; status: string; }
export interface MonthlyReport { employeeId: string; month: string; recordedDays: number; presentDays: number; actualMinutes: number; items: Timesheet[]; }

const path = (organizationId: string, suffix: string) => `organizations/${organizationId}/attendance/${suffix}`;
const key = (organizationId: string | null, scope: string) => ['attendance', organizationId, scope] as const;
const month = new Date().toISOString().slice(0, 7);

export function useAttendanceScope(organizationId: string | null) {
  return useQuery({
    queryKey: key(organizationId, 'scope'),
    queryFn: () => apiClient.getOne<AttendanceScope>(path(organizationId!, 'scope')),
    enabled: Boolean(organizationId),
  });
}

export function useAttendance(organizationId: string | null, employeeId: string | null, organizationAdmin = false) {
  const enabled = Boolean(organizationId);
  const reportEnabled = enabled && Boolean(employeeId);
  const employeeQuery = employeeId ? `employeeId=${encodeURIComponent(employeeId)}` : '';
  return {
    shifts: useQuery({ queryKey: key(organizationId, 'shifts'), queryFn: () => apiClient.get<Shift>(path(organizationId!, 'shifts')), enabled }),
    schedules: useQuery({ queryKey: key(organizationId, 'schedules'), queryFn: () => apiClient.get<Schedule>(path(organizationId!, 'schedules')), enabled }),
    assignments: useQuery({ queryKey: key(organizationId, 'assignments'), queryFn: () => apiClient.get<ScheduleAssignment>(path(organizationId!, 'assignments')), enabled: enabled && organizationAdmin }),
    monthlyReport: useQuery({ queryKey: key(organizationId, `monthly-${month}-${employeeId}`), queryFn: () => apiClient.getOne<MonthlyReport>(path(organizationId!, `reports/monthly?month=${month}&${employeeQuery}`)), enabled: reportEnabled }),
    adjustments: useQuery({ queryKey: key(organizationId, 'adjustments'), queryFn: () => apiClient.get<Adjustment>(path(organizationId!, 'adjustments')), enabled }),
    leaves: useQuery({ queryKey: key(organizationId, 'leaves'), queryFn: () => apiClient.get<LeaveRequest>(path(organizationId!, 'leave-requests')), enabled }),
  };
}

export function useAttendanceMutations(organizationId: string | null) {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['attendance', organizationId] });
  const post = (suffix: string, body?: unknown) => apiClient.post(path(organizationId!, suffix), body ?? {});
  return {
    checkIn: useMutation({ mutationFn: () => post('check-in'), onSuccess: refresh }),
    checkOut: useMutation({ mutationFn: () => post('check-out'), onSuccess: refresh }),
    createShift: useMutation({ mutationFn: (body: { name: string; startTime: string; endTime: string; breakMinutes: number }) => post('shifts', body), onSuccess: refresh }),
    createSchedule: useMutation({ mutationFn: (body: { name: string; slots: { shiftId: string; dayOfWeek: number }[] }) => post('schedules', body), onSuccess: refresh }),
    createAssignment: useMutation({ mutationFn: (body: { employeeId: string; scheduleId: string; effectiveFrom: string }) => post('assignments', body), onSuccess: refresh }),
    createAdjustment: useMutation({ mutationFn: (body: { workDate: string; checkInAt?: string; checkOutAt?: string; reason: string }) => post('adjustments', body), onSuccess: refresh }),
    decideAdjustment: useMutation({ mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) => post(`adjustments/${id}/decision`, { decision }), onSuccess: refresh }),
    createLeave: useMutation({ mutationFn: (body: { startDate: string; endDate: string; reason: string }) => post('leave-requests', body), onSuccess: refresh }),
    decideLeave: useMutation({ mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) => post(`leave-requests/${id}/decision`, { decision }), onSuccess: refresh }),
  };
}
