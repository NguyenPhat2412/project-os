'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ScoreSegment {
  value: number;
  color: string;
  label: string;
}

interface TooltipState {
  active?: boolean;
  x?: number;
  y?: number;
  segment?: ScoreSegment;
}

interface Props {
  segments: ScoreSegment[];
  title: string;
  label: string;
  labelColor: string;
  description: string;
  warnText?: string;
  className?: string;
}

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number, r: number, innerR: number) {
  if (endDeg === startDeg) return '';
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  const sweep = (endDeg - startDeg + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  const si = polar(endDeg, innerR);
  const ei = polar(startDeg, innerR);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${si.x} ${si.y} A ${innerR} ${innerR} 0 ${large} 0 ${ei.x} ${ei.y} Z`;
}

export function ScoreDonut({ segments, title, label, labelColor, description, warnText, className }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>({});

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const R = 44;
  const r = 30;

  const segmentPaths = segments.reduce<(ScoreSegment & { start: number; end: number; sizeDeg: number })[]>((acc, seg) => {
    const sizeDeg = total > 0 ? (seg.value / total) * 360 : 0;
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    acc.push({ ...seg, start, end: start + sizeDeg, sizeDeg });
    return acc;
  }, []);

  const firstSeg = segments[0];
  const firstPct = total > 0 && firstSeg ? Math.round((firstSeg.value / total) * 100) : 0;

  const tooltipContent = tooltip.segment ? (
    <div className='pointer-events-none fixed z-50 border border-border bg-secondary px-3 py-1.5 text-[12px] panel-inner' style={{ left: (tooltip.x ?? 0) + 10, top: (tooltip.y ?? 0) + 10 }}>
      <span style={{ color: tooltip.segment.color }}>{tooltip.segment.label}</span>: {tooltip.segment.value}
    </div>
  ) : null;

  return (
    <Card className={cn('col-span-4 max-lg:col-span-6 max-sm:col-span-12', className)}>
      <CardHeader className='items-center pb-3 text-center'>
        <CardTitle className='text-sm'>{title}</CardTitle>
        <CardDescription>Chỉ số tổng quan theo tỷ lệ hiện tại</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col items-center justify-center gap-3'>
        <div className='relative'>
          <svg viewBox='0 0 100 100' className='h-28 w-28' onMouseLeave={() => setTooltip({})}>
            {segmentPaths.map((seg, i) =>
              seg.sizeDeg > 0 ? (
                <path
                  key={i}
                  d={arcPath(seg.start, seg.end, R, r)}
                  fill={seg.color}
                  strokeWidth={0}
                  onMouseEnter={(e) => setTooltip({ active: true, x: e.clientX, y: e.clientY, segment: seg })}
                  className='cursor-pointer transition-opacity hover:opacity-80'
                />
              ) : null,
            )}
          </svg>

          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <span className='font-sans text-[20px] font-bold leading-none' style={{ color: labelColor }}>
              {firstPct}%
            </span>
            <span className='mt-0.5 text-[9px] text-muted-foreground'>tỷ lệ</span>
          </div>

          {tooltipContent}
        </div>

        <div className='text-[12px] font-semibold' style={{ color: labelColor }}>
          {label}
        </div>
        <div className='text-center text-[12px] leading-relaxed text-muted-foreground'>
          {description}
          {warnText && (
            <span className='mt-0.5 block font-semibold' style={{ color: 'oklch(0.577 0.245 27.325)' }}>
              {warnText}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
