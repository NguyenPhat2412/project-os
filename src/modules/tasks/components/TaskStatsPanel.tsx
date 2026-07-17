'use client';

import * as React from 'react';
import type { Task, TaskColumn, Priority } from '@/modules/tasks/types/task';
import { getTaskColumnProgress, isTaskDoneStatus } from '@/modules/tasks/utils/taskColumns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BreakdownBarChart } from '@/components/ui/shared/breakdown-bar-chart';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

type TaskWithId = Task & { id: string };

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: { key: Priority; label: string; color: string }[] = [
  { key: 'High', label: 'High', color: TASK_PRIORITY_META.High.chartColor },
  { key: 'Normal', label: 'Normal', color: TASK_PRIORITY_META.Normal.chartColor },
  { key: 'Low', label: 'Low', color: TASK_PRIORITY_META.Low.chartColor },
];

// ─── Overdue detection ────────────────────────────────────────────────────────

function parseTaskDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string' || !value.trim()) return null;

  const vietnameseDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vietnameseDate) {
    const [, day, month, year] = vietnameseDate;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Returns true if deadline is a past date and task is not done */
function isOverdue(deadline: string | Date | null | undefined, isDone: boolean): boolean {
  if (isDone) return false;
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (deadline instanceof Date) return deadline < today;

  const parsed = parseTaskDate(deadline);
  return parsed ? calendarDay(parsed) < today.getTime() : false;
}

interface Props {
  tasks: TaskWithId[];
  columns: TaskColumn[];
}

// ─── SVG Donut chart (completion, deadline and progress) ─────────────────────

const DONUT_CONFIG = {
  onTime: { label: 'Hoàn thành đúng hạn', color: 'oklch(0.646 0.222 142.116)' },
  completedLate: { label: 'Hoàn thành muộn', color: 'oklch(0.705 0.173 58.8)' },
  overdue: { label: 'Quá hạn', color: 'oklch(0.577 0.245 27.325)' },
  inProgress: { label: 'Đang thực hiện', color: 'oklch(0.585 0.219 275.5)' },
  notStarted: { label: 'Chưa thực hiện', color: 'oklch(0.551 0.027 264.4)' },
  incompleteData: { label: 'Thiếu ngày hoàn thành/hết hạn', color: 'oklch(0.795 0.159 83.7)' },
} as const;

type DonutCategory = 'onTime' | 'completedLate' | 'overdue' | 'inProgress' | 'notStarted' | 'incompleteData';

interface DonutSeg {
  category: DonutCategory;
  value: number;
  detail?: string;
}

function buildDeadlineSegments(tasks: TaskWithId[], columns: TaskColumn[]): DonutSeg[] {
  const counts: Record<DonutCategory, number> = {
    onTime: 0,
    completedLate: 0,
    overdue: 0,
    inProgress: 0,
    notStarted: 0,
    incompleteData: 0,
  };
  let inProgressTotal = 0;

  for (const task of tasks) {
    const done = isTaskDoneStatus(task.status, columns);
    const deadline = parseTaskDate(task.deadline);

    if (done) {
      const completedAt = parseTaskDate(task.completedAt);
      if (!deadline || !completedAt) {
        counts.incompleteData += 1;
      } else if (calendarDay(completedAt) <= calendarDay(deadline)) {
        counts.onTime += 1;
      } else {
        counts.completedLate += 1;
      }
      continue;
    }

    if (!deadline) {
      counts.incompleteData += 1;
      continue;
    }

    if (isOverdue(deadline, false)) {
      counts.overdue += 1;
      continue;
    }

    const progress = getTaskColumnProgress(task.status, columns);
    if (progress > 0) {
      counts.inProgress += 1;
      inProgressTotal += progress;
    } else {
      counts.notStarted += 1;
    }
  }

  const inProgressAverage = counts.inProgress > 0 ? Math.round(inProgressTotal / counts.inProgress) : 0;
  return (Object.keys(counts) as DonutCategory[])
    .map((category) => ({
      category,
      value: counts[category],
      detail: category === 'inProgress' && counts.inProgress > 0 ? `Tiến độ TB ${inProgressAverage}%` : undefined,
    }))
    .filter((segment) => segment.value > 0);
}

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number, r: number, innerR: number) {
  if (endDeg <= startDeg) return '';
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  const sweep = (endDeg - startDeg + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  const si = polar(endDeg, innerR);
  const ei = polar(startDeg, innerR);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${si.x} ${si.y} A ${innerR} ${innerR} 0 ${large} 0 ${ei.x} ${ei.y} Z`;
}

function TaskDonut({ tasks, columns }: { tasks: TaskWithId[]; columns: TaskColumn[] }) {
  const [hovered, setHovered] = React.useState<DonutCategory | null>(null);

  const segments = buildDeadlineSegments(tasks, columns);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const completed = tasks.filter((task) => isTaskDoneStatus(task.status, columns)).length;
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const R = 44;
  const r = 30;

  const segmentPaths = segments.reduce<{ category: DonutCategory; start: number; end: number; sizeDeg: number }[]>((acc, seg) => {
    const sizeDeg = total > 0 ? (seg.value / total) * 360 : 0;
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    acc.push({ category: seg.category, start, end: start + sizeDeg, sizeDeg });
    return acc;
  }, []);

  return (
    <Card className='col-span-1 flex flex-col'>
      <CardHeader className='flex flex-col space-y-1 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div>
          <CardTitle className='text-sm'>Cơ cấu Tasks</CardTitle>
          <CardDescription>Deadline và tiến độ thực tế</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 justify-center'>
        {segments.length === 0 ? (
          <p className='text-xs text-muted-foreground'>Chưa có dữ liệu deadline.</p>
        ) : (
          <div className='grid w-full grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* SVG donut */}
            <div className='flex justify-center'>
              <div className='relative'>
                <svg viewBox='0 0 100 100' className='h-36 w-36' onMouseLeave={() => setHovered(null)}>
                  {segmentPaths.map((seg) =>
                    seg.sizeDeg > 0 ? (
                      <path key={seg.category} d={arcPath(seg.start, seg.end, R, r)} fill={DONUT_CONFIG[seg.category].color} strokeWidth={0} onMouseEnter={() => setHovered(seg.category)} className='cursor-pointer transition-opacity hover:opacity-80' />
                    ) : null,
                  )}
                </svg>

                {/* Center label */}
                <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='text-2xl font-bold tabular-nums'>{completionRate}%</span>
                  <span className='text-[9px] text-muted-foreground'>hoàn thành</span>
                </div>
              </div>
            </div>

            {/* Legend — clickable */}
            <div className='flex flex-col justify-center space-y-2'>
              {segments.map((seg) => {
                const cfg = DONUT_CONFIG[seg.category];
                const isActive = hovered === seg.category;
                const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;

                return (
                  <div
                    key={seg.category}
                    className={`flex cursor-pointer items-center justify-between rounded-lg p-2.5 transition-all ${isActive ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    onMouseEnter={() => setHovered(seg.category)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className='flex items-center gap-2'>
                      <span className='h-3 w-3 shrink-0 rounded-full' style={{ backgroundColor: cfg.color }} />
                      <span className='text-sm font-medium'>{cfg.label}</span>
                    </div>
                    <div className='text-right'>
                      <div className='font-bold tabular-nums'>{seg.value}</div>
                      <div className='text-[10px] text-muted-foreground'>{seg.detail ?? `${pct}%`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

const SUMMARY_CARDS = [
  { label: 'Tổng công việc', sub: 'Tất cả trạng thái', valueKey: 'total' as const },
  { label: 'Cao ưu tiên', sub: 'Chưa hoàn thành', valueKey: 'highPriority' as const },
  { label: 'Đã quá hạn', sub: 'Chưa hoàn thành', valueKey: 'overdue' as const },
  { label: 'Chưa thực hiện', sub: 'Trạng thái To Do', valueKey: 'todo' as const },
  { label: 'Đang thực hiện', sub: 'Chưa hoàn thành', valueKey: 'inProgress' as const },
  { label: 'Đã hoàn thành', sub: 'Tỷ lệ hoàn thành', valueKey: 'doneRate' as const, isPercent: true },
];

interface SummaryValues {
  total: number;
  highPriority: number;
  overdue: number;
  todo: number;
  inProgress: number;
  inProgressRate: number;
  doneRate: number; // percent
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export function TaskStatsPanel({ tasks, columns }: Props) {
  // Compute stats
  const done = tasks.filter((t) => isTaskDoneStatus(t.status, columns)).length;
  const highPriority = tasks.filter((t) => t.priority === 'High' && !isTaskDoneStatus(t.status, columns)).length;
  const overdue = tasks.filter((t) => isOverdue(t.deadline, isTaskDoneStatus(t.status, columns))).length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const activeTasks = tasks.filter((t) => !isTaskDoneStatus(t.status, columns) && getTaskColumnProgress(t.status, columns) > 0);
  const inProgress = activeTasks.length;
  const inProgressRate = inProgress > 0
    ? Math.round(activeTasks.reduce((sum, task) => sum + getTaskColumnProgress(task.status, columns), 0) / inProgress)
    : 0;
  const total = tasks.length;
  const doneRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const summaryValues: SummaryValues = { total, highPriority, overdue, todo, inProgress, inProgressRate, doneRate };

  // Breakdown items
  const priorityItems = PRIORITY_CONFIG.map((p) => ({
    name: p.label,
    value: tasks.filter((t) => t.priority === p.key).length,
    color: p.color,
  }));

  const statusItems = columns.map((col) => ({
    name: col.title,
    value: tasks.filter((t) => t.status === col.id).length,
    color: col.isDone ? 'oklch(0.646 0.222 142.116)' : (col.color ?? 'oklch(0.600 0.160 240.876)'),
  }));

  return (
    <div className='space-y-4'>
      {/* Summary cards — responsive grid: 2 cols sm, 3 cols lg, 6 cols xl */}
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        {SUMMARY_CARDS.map(({ label, sub, valueKey, isPercent }) => {
          const raw = summaryValues[valueKey];
          const display = isPercent ? `${raw}%` : raw;
          const detail = valueKey === 'inProgress' && inProgress > 0 ? `Tiến độ TB ${inProgressRate}%` : sub;
          return (
            <Card key={label}>
              <CardHeader className='pb-2'>
                <CardDescription className='text-xs'>{label}</CardDescription>
                <CardTitle className='text-xl font-semibold tabular-nums'>{display}</CardTitle>
              </CardHeader>
              <CardContent className='pt-0'>
                <p className='text-[11px] text-muted-foreground'>{detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className='grid gap-4 lg:grid-cols-3'>
        <BreakdownBarChart title='Theo mức ưu tiên' items={priorityItems} className='col-span-1' />
        <BreakdownBarChart title='Theo trạng thái' items={statusItems} className='col-span-1' />
        <TaskDonut tasks={tasks} columns={columns} />
      </div>
    </div>
  );
}
