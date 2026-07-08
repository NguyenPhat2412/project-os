'use client';
/**
 * TaskCalendarView
 * ────────────────
 * Month calendar grid showing tasks by deadline.
 * Built without external dependencies.
 * Tasks without deadline shown in a separate section below.
 */

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task, Priority } from '@/modules/tasks/types/task';
import { TASK_PRIORITY_META } from '@/lib/constants/work-item-colors';

// ── helpers ───────────────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<Priority, string> = {
  High: TASK_PRIORITY_META.High.solidClass,
  Normal: TASK_PRIORITY_META.Normal.solidClass,
  Low: TASK_PRIORITY_META.Low.solidClass,
};

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

function parseDate(ddmmyyyy: string): Date | null {
  if (!ddmmyyyy) return null;
  const [dd, mm, yyyy] = ddmmyyyy.split('/').map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function datesEqual(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Tuesday = 1, ... Sunday = 6
  let startDow = firstDay.getDay() - 1; // JS: 0=Sun, convert to Mon=0
  if (startDow < 0) startDow = 6;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

// ── Chip component ─────────────────────────────────────────────────────────────
function TaskChip({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left text-[12px] font-medium px-1.5 py-0.5 rounded-sm truncate transition-opacity hover:opacity-80 ${PRIORITY_COLOR[task.priority]}`}
      title={task.title}
    >
      {task.title}
    </button>
  );
}

// ── props ─────────────────────────────────────────────────────────────────────
interface Props {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

// ── component ─────────────────────────────────────────────────────────────────
export function TaskCalendarView({ tasks, onEditTask }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const goToNext = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };
  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const weeks = buildMonthGrid(viewYear, viewMonth);

  // Map date string → tasks
  const tasksByDate: Record<string, Task[]> = {};
  const noDeadlineTasks: Task[] = [];
  for (const task of tasks) {
    if (!task.deadline) {
      noDeadlineTasks.push(task);
      continue;
    }
    const d = parseDate(task.deadline);
    if (!d) {
      noDeadlineTasks.push(task);
      continue;
    }
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <Button variant='outline' size='xs' onClick={goToPrev} className='border-border'>
          <ChevronLeftIcon size={14} />
        </Button>
        <span className='text-[15px] font-bold min-w-32.5 text-center'>
          {MONTH_NAMES[viewMonth]} / {viewYear}
        </span>
        <Button variant='outline' size='xs' onClick={goToNext} className='border-border'>
          <ChevronRightIcon size={14} />
        </Button>
        <Button variant='outline' size='xs' onClick={goToToday} className='ml-2 border-border text-muted-foreground'>
          Hôm nay
        </Button>
      </div>

      {/* Grid */}
      <div className='border border-border rounded-sm overflow-hidden'>
        {/* Weekday headers */}
        <div className='grid grid-cols-7 border-b border-border'>
          {WEEKDAYS.map((d) => (
            <div key={d} className='py-2 text-center font-mono-dm text-[12px] text-muted-foreground font-semibold uppercase'>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className='grid grid-cols-7 border-b border-border last:border-b-0'>
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} className='min-h-22 bg-secondary/30 border-r border-border last:border-r-0' />;
              }
              const isToday = datesEqual(day, today);
              const isCurrentMonth = day.getMonth() === viewMonth;
              const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const dayTasks = tasksByDate[key] ?? [];

              return (
                <div key={di} className={`min-h-22 p-1.5 border-r border-border last:border-r-0 ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                  {/* Day number */}
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold mb-1 ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>{day.getDate()}</div>
                  {/* Task chips — max 3 */}
                  <div className='space-y-0.5'>
                    {dayTasks.slice(0, 3).map((t) => (
                      <TaskChip key={t.id} task={t} onClick={() => onEditTask(t)} />
                    ))}
                    {dayTasks.length > 3 && <div className='text-[12px] text-muted-foreground px-1'>+{dayTasks.length - 3} thêm</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* No deadline section */}
      {noDeadlineTasks.length > 0 && (
        <div className='border border-border rounded-sm p-4'>
          <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3'>Không có ngày hết hạn ({noDeadlineTasks.length})</div>
          <div className='flex flex-wrap gap-2'>
            {noDeadlineTasks.map((task) => (
              <button key={task.id} onClick={() => onEditTask(task)} className={`text-[12px] font-medium px-2 py-1 rounded-sm truncate max-w-50 transition-opacity hover:opacity-80 ${PRIORITY_COLOR[task.priority]}`} title={task.title}>
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
