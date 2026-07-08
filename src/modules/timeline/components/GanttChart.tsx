'use client';
import { useState, useMemo } from 'react';
import dayjs from '@/lib/dayjs';
import type { Epic } from '@/modules/backlog/types/backlog';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'weeks' | 'months' | 'quarters' | 'years';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'weeks', label: 'Tuần' },
  { value: 'months', label: 'Tháng' },
  { value: 'quarters', label: 'Quý' },
  { value: 'years', label: 'Năm' },
];

const EPIC_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#f97316', '#14b8a6'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

/** Returns the Monday of the week containing d */
function mondayOf(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  const day = c.getDay();
  c.setDate(c.getDate() - (day === 0 ? 6 : day - 1));
  return c;
}

// ── Window computation ────────────────────────────────────────────────────────

interface ColLabel {
  main: string;
  sub?: string;
  weekend?: boolean;
}

interface ViewWindow {
  wStart: Date;
  wEnd: Date;
  cols: ColLabel[];
  /** Minimum px width per column — drives total scrollable width */
  colMinPx: number;
  /** 0-100% position of today within the window; -1 if outside */
  todayPct: number;
  /** Two-tier header groups (months/years view) */
  groups?: { label: string; span: number }[];
  /** Whether to render the cols row when groups are present (years view: true, months view: false) */
  colsVisible?: boolean;
}

function computeWindow(epics: (Epic & { id: string })[], view: ViewMode): ViewWindow {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const allDates = epics
    .filter((e) => e.startDate && e.dueDate)
    .flatMap((e) => [parseDate(e.startDate), parseDate(e.dueDate)])
    .filter(Boolean) as Date[];

  const pStart = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pEnd = allDates.length ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date(now.getFullYear(), now.getMonth() + 5, 0);

  let wStart: Date, wEnd: Date, cols: ColLabel[], colMinPx: number;
  let groups: { label: string; span: number }[] | undefined;
  let colsVisible: boolean | undefined;

  if (view === 'weeks') {
    // Day columns covering the full project span
    wStart = mondayOf(pStart);
    wEnd = new Date(mondayOf(pEnd).getTime() + 6 * 86400000);
    colMinPx = 38;
    const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    cols = [];
    const c = new Date(wStart);
    while (c <= wEnd) {
      const dayIdx = c.getDay() === 0 ? 6 : c.getDay() - 1;
      cols.push({ main: DAY_LABELS[dayIdx], sub: `${c.getDate()}/${c.getMonth() + 1}`, weekend: dayIdx >= 5 });
      c.setDate(c.getDate() + 1);
    }
  } else if (view === 'months') {
    // Week columns grouped by month — header shows full month name only (no W1/W2 row)
    wStart = mondayOf(pStart);
    wEnd = new Date(mondayOf(pEnd).getTime() + 6 * 86400000);
    const multiYear = pStart.getFullYear() !== pEnd.getFullYear();
    colMinPx = 56;
    cols = [];
    groups = [];
    let currentMonthKey = '';
    const c = new Date(wStart);
    while (c <= wEnd) {
      const mk = `${c.getFullYear()}-${c.getMonth()}`;
      if (mk !== currentMonthKey) {
        currentMonthKey = mk;
        const monthName = dayjs(c).format('MMMM');
        const label = multiYear ? `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${c.getFullYear()}` : monthName.charAt(0).toUpperCase() + monthName.slice(1);
        groups.push({ label, span: 0 });
      }
      groups[groups.length - 1].span++;
      cols.push({ main: '' });
      c.setDate(c.getDate() + 7);
    }
  } else if (view === 'quarters') {
    // Quarter columns covering the full project span
    const qs = Math.floor(pStart.getMonth() / 3);
    wStart = new Date(pStart.getFullYear(), qs * 3, 1);
    const qe = Math.floor(pEnd.getMonth() / 3);
    wEnd = new Date(pEnd.getFullYear(), (qe + 1) * 3, 0);
    colMinPx = 120;
    cols = [];
    const c = new Date(wStart);
    while (c <= wEnd) {
      cols.push({ main: `Quý ${Math.floor(c.getMonth() / 3) + 1} ${c.getFullYear()}` });
      c.setMonth(c.getMonth() + 3);
    }
  } else {
    // Years view: month sub-columns grouped by year
    wStart = new Date(pStart.getFullYear(), 0, 1);
    wEnd = new Date(pEnd.getFullYear(), 11, 31);
    colMinPx = 60;
    cols = [];
    groups = [];
    colsVisible = true;
    const c = new Date(wStart);
    while (c <= wEnd) {
      const year = String(c.getFullYear());
      if (!groups.length || groups[groups.length - 1].label !== year) {
        groups.push({ label: year, span: 0 });
      }
      groups[groups.length - 1].span++;
      cols.push({ main: `T${c.getMonth() + 1}` });
      c.setMonth(c.getMonth() + 1);
    }
  }

  const span = wEnd.getTime() - wStart.getTime();
  const nowMs = now.getTime();
  const todayPct = nowMs >= wStart.getTime() && nowMs <= wEnd.getTime() ? ((nowMs - wStart.getTime()) / span) * 100 : -1;

  return { wStart, wEnd, cols, colMinPx, todayPct, groups, colsVisible };
}

// ── Bar computation ────────────────────────────────────────────────────────────

interface BarData {
  rowLabel: string;
  label: string;
  leftPercent: number;
  widthPercent: number;
  color: string;
}

function computeBars(epics: (Epic & { id: string })[], wStart: Date, wEnd: Date): BarData[] {
  const spanMs = wEnd.getTime() - wStart.getTime();
  return epics
    .filter((e) => e.startDate && e.dueDate)
    .map((e, i) => {
      const start = parseDate(e.startDate)!;
      const end = parseDate(e.dueDate)!;
      const cs = Math.max(start.getTime(), wStart.getTime());
      const ce = Math.min(end.getTime(), wEnd.getTime());
      return {
        rowLabel: `${e.icon} ${e.name}`,
        label: `${e.startDate} → ${e.dueDate}`,
        leftPercent: ((cs - wStart.getTime()) / spanMs) * 100,
        widthPercent: Math.max(((ce - cs) / spanMs) * 100, 1),
        color: EPIC_COLORS[i % EPIC_COLORS.length],
      };
    });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  epics: (Epic & { id: string })[];
}

export function GanttChart({ epics }: Props) {
  const [view, setView] = useState<ViewMode>('months');

  const { wStart, wEnd, cols, colMinPx, todayPct, groups, colsVisible } = useMemo(() => computeWindow(epics, view), [epics, view]);

  const bars = useMemo(() => computeBars(epics, wStart, wEnd), [epics, wStart, wEnd]);

  const totalChartWidth = cols.length * colMinPx;

  return (
    <div className='bg-card border border-border panel p-5 mb-5'>
      {/* ── Header ── */}
      <div className='flex items-center justify-between mb-4'>
        <div className='font-sans text-[16px] font-bold'>Lộ trình phát triển dự án</div>
        <div className='flex items-center gap-0.5 bg-secondary panel-inner p-0.5'>
          {VIEW_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setView(opt.value)} className={`px-3 h-8 rounded-sm text-[12px] font-medium transition-colors ${view === opt.value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart: fixed labels | scrollable chart ── */}
      <div className='flex'>
        {/* Labels column — stays fixed while chart scrolls */}
        <div className='min-w-40 shrink-0'>
          {/* Spacer matching col-header height (two-tier = h-14, single = h-8) */}
          <div className={`${groups && colsVisible ? 'h-14' : 'h-8'} mb-2`} />
          {bars.map((bar, i) => (
            <div key={i} className='h-10 mb-1.25 flex items-center'>
              <span className='text-[12.5px] font-medium pr-2.5 whitespace-nowrap text-muted-foreground'>{bar.rowLabel}</span>
            </div>
          ))}
        </div>

        {/* Scrollable chart area */}
        <div className='flex-1 overflow-x-auto'>
          <div style={{ minWidth: `${totalChartWidth}px` }}>
            {/* Column headers */}
            {groups && (
              // Groups row: month names (months view) or year names (years view)
              <div className={`grid text-center font-mono-dm text-[12px] font-semibold text-muted-foreground ${colsVisible ? 'h-6' : 'h-8'} mb-0`} style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
                {groups.map((g, i) => (
                  <span key={i} className='flex items-center justify-center border-r border-border last:border-0' style={{ gridColumn: `span ${g.span}` }}>
                    {g.label}
                  </span>
                ))}
              </div>
            )}
            {(!groups || colsVisible) && (
              // Weeks / Quarters / Years-sub row
              <div className='grid text-center font-mono-dm text-[12px] font-semibold text-muted-foreground h-8 mb-2' style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
                {cols.map((col, i) => (
                  <span key={i} className={`flex flex-col items-center justify-center leading-tight rounded-sm ${col.main.startsWith('▼') ? 'text-primary' : col.weekend ? 'text-red-500 opacity-70' : ''}`}>
                    <span>{col.main}</span>
                    {col.sub && <span className='text-[9px] opacity-60 font-normal'>{col.sub}</span>}
                  </span>
                ))}
              </div>
            )}

            {/* Bar tracks + today line */}
            <div className='relative'>
              {todayPct >= 0 && <div className='absolute top-0 bottom-0 w-[2px] bg-primary opacity-50 z-10 pointer-events-none' style={{ left: `${todayPct}%` }} />}
              {bars.map((bar, i) => (
                <div key={i} className='relative h-10 bg-secondary panel-inner overflow-hidden mb-1.25'>
                  <div
                    className='absolute top-1 h-8 rounded-sm flex items-center px-2 text-[12px] font-bold whitespace-nowrap overflow-hidden text-ellipsis'
                    style={{ left: `${bar.leftPercent}%`, width: `${bar.widthPercent}%`, background: bar.color, color: 'rgba(0,0,0,0.8)' }}
                  >
                    {bar.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
