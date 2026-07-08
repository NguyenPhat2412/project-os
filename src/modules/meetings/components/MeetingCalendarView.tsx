'use client';
/**
 * MeetingCalendarView
 * ───────────────────
 * Month calendar grid showing meetings by date.
 * Mirrors TaskCalendarView pattern: custom grid, prev/next navigation,
 * chips per day, overflow "+N more", no-date section at bottom.
 */

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Meeting } from '@/modules/meetings/types/meeting';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

function parseDate(ddmmyyyy: string): Date | null {
  if (!ddmmyyyy) return null;
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function datesEqual(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay() - 1; // JS: 0=Sun → convert to Mon=0
  if (startDow < 0) startDow = 6;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

// ── Chip ───────────────────────────────────────────────────────────────────────
function MeetingChip({ meeting, onClick }: { meeting: Meeting & { id: string }; onClick: () => void }) {
  const color = meeting.important ? 'bg-red-500/80 text-white' : 'bg-primary/80 text-white';
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left text-[12px] font-medium px-1.5 py-0.5 rounded-sm truncate transition-opacity hover:opacity-80 ${color}`}
      title={meeting.title}
    >
      {meeting.title}
    </button>
  );
}

// ── props ───────────────────────────────────────────────────────────────────────
interface Props {
  meetings: (Meeting & { id: string })[];
  onView: (meeting: Meeting & { id: string }) => void;
  onEdit: (meeting: Meeting & { id: string }) => void;
}

// ── component ─────────────────────────────────────────────────────────────────
export function MeetingCalendarView({ meetings, onView, onEdit }: Props) {
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

  // Map date string → meetings
  const meetingsByDate: Record<string, (Meeting & { id: string })[]> = {};
  const noDateMeetings: (Meeting & { id: string })[] = [];
  for (const m of meetings) {
    if (!m.date) {
      noDateMeetings.push(m);
      continue;
    }
    const d = parseDate(m.date);
    if (!d) {
      noDateMeetings.push(m);
      continue;
    }
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!meetingsByDate[key]) meetingsByDate[key] = [];
    meetingsByDate[key].push(m);
  }

  return (
    <div className='space-y-4 border border-border rounded-sm p-4'>
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
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`py-2 text-center font-mono-dm text-[12px] font-semibold uppercase ${i >= 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
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
              const dayMeetings = meetingsByDate[key] ?? [];

              return (
                <div key={di} className={`min-h-22 p-1.5 border-r border-border last:border-r-0 ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold mb-1 ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>{day.getDate()}</div>
                  <div className='space-y-0.5'>
                    {dayMeetings.slice(0, 3).map((m) => (
                      <MeetingChip key={m.id} meeting={m} onClick={() => onView(m)} />
                    ))}
                    {dayMeetings.length > 3 && <div className='text-[12px] text-muted-foreground px-1'>+{dayMeetings.length - 3} thêm</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* No date section */}
      {noDateMeetings.length > 0 && (
        <div className='border border-border rounded-sm p-4'>
          <div className='text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3'>Không có ngày ({noDateMeetings.length})</div>
          <div className='flex flex-wrap gap-2'>
            {noDateMeetings.map((m) => (
              <Button key={m.id} size='sm' variant={m.important ? 'destructive' : 'default'} onClick={() => onView(m)} className='truncate max-w-50 text-[12px]' title={m.title}>
                {m.title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
