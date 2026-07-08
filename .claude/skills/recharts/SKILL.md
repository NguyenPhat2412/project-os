---
name: recharts
description: Implement charts and data visualizations using Recharts in ProjectOS. ALWAYS activate when adding a new chart, replacing an existing chart, or working with any data visualization component. Covers AreaChart, BarChart, PieChart, RadialBarChart with ProjectOS design tokens.
argument-hint: '[chart type or component name]'
---

# Recharts — ProjectOS Chart Implementation

## When to Use This Skill

- Adding a new chart to any module
- Replacing custom SVG charts with Recharts
- Implementing a stats panel with score donut or breakdown bars
- Working with `BurndownChart`, `TeamStatsPanel`, `BudgetStatsPanel`, `TaskStatsPanel`, `BugStatsPanel`, `RiskStatsPanel`
- Any component that visualizes data (trends, breakdowns, scores, comparisons)

> **Full reference:** Read `.claude/docs/recharts.md` for complete patterns, design tokens, and code snippets.

---

## Shared Components — Use These First

Before building a custom chart, check if a shared component already fits:

| Component           | File                                          | Use For                                                         |
| ------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| `ScoreDonut`        | `src/components/shared/ScoreDonut.tsx`        | Score/health radial (0–100), used in all StatsPanel modules     |
| `BreakdownBarChart` | `src/components/shared/BreakdownBarChart.tsx` | Category breakdown by count (status, priority, severity, level) |

```tsx
// Score donut — health/quality score
import { ScoreDonut } from '@/components/shared/ScoreDonut';
<ScoreDonut title='...' score={score} color={color} label={label} description='...' warnText={...} />

// Breakdown bars — count-based categories
import { BreakdownBarChart } from '@/components/shared/BreakdownBarChart';
<BreakdownBarChart title='...' items={[{ name, value, color }]} />
```

---

## Chart Type Selection Guide

| Data pattern              | Chart type      | Recharts component                    |
| ------------------------- | --------------- | ------------------------------------- |
| Trend over time           | Area chart      | `AreaChart` + `Area`                  |
| Count by category         | Horizontal bars | `BarChart` layout='vertical'          |
| Distribution / proportion | Donut           | `PieChart` + `Pie` innerRadius        |
| Single score (0–100)      | Radial arc      | `RadialBarChart` + `RadialBar`        |
| Member/item comparison    | Horizontal bars | `BarChart` layout='vertical' + `Cell` |

---

## Implementation Checklist

- [ ] Check if `ScoreDonut` or `BreakdownBarChart` already covers the use case
- [ ] Wrap chart in `<ResponsiveContainer width='100%' height={...}>`
- [ ] Use ProjectOS CSS variables for colors (never hardcode hex unless amber `#f59e0b` / orange `#f97316`)
- [ ] Set `axisLine={false}` and `tickLine={false}` on all axes
- [ ] Add `animationDuration={700–900}` and `animationEasing='ease-out'`
- [ ] Write a custom `Tooltip` component — never use the default Recharts tooltip unstyled
- [ ] Use `cursor={{ fill: 'var(--os-surface2)' }}` on BarChart tooltips
- [ ] Set `strokeWidth={0}` on `<Pie>` to remove slice borders
- [ ] Do NOT use the built-in Recharts `<Legend>` — render legend as HTML instead

---

## ProjectOS Color Rules

```tsx
// Semantic colors — always use these
'var(--os-accent)'   // #6c63ff — default bars, lines, active state
'var(--os-green)'    // #3dd68c — good, done, healthy
'var(--os-red)'      // #ff5f5f — danger, overdue, overloaded
'var(--os-muted)'    // #5e5e78 — axis ticks, inactive

// Dynamic severity colors
value > 90  → 'var(--os-red)'
value > 70  → '#f59e0b'   // amber warning
value ≤ 70  → 'var(--os-accent)'
```

---

## Animation Standards

```tsx
animationBegin={0}
animationDuration={700}    // BarChart
animationDuration={800}    // AreaChart
animationDuration={900}    // RadialBarChart
animationEasing='ease-out'
```

---

## Tooltip Template

```tsx
interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { name: string; color: string } }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className='bg-(--os-surface2) border border-(--os-border) rounded-sm px-3 py-2 shadow-lg'>
      <p className='text-[12px] text-(--os-muted) mb-0.5'>{label ?? payload[0].payload.name}</p>
      <p className='font-mono-dm text-[13px] font-semibold' style={{ color: payload[0].payload.color }}>
        {payload[0].value}
      </p>
    </div>
  );
}
```

---

## Related

- `.claude/docs/recharts.md` — Full patterns, complete code snippets, all chart types
- `.claude/docs/ui-system.md` — Design tokens, color system, typography
- `src/components/shared/ScoreDonut.tsx` — Reusable radial score component
- `src/components/shared/BreakdownBarChart.tsx` — Reusable horizontal bar breakdown
