# Recharts — ProjectOS Patterns & Guidelines

> Tài liệu này mô tả cách sử dụng Recharts trong ProjectOS: shared components, design tokens, và patterns chuẩn cho từng loại chart.

---

## Cài đặt

```bash
npm install recharts
```

---

## Design Tokens ProjectOS

Luôn dùng CSS variables sau thay vì hardcode màu:

| Token                | Giá trị   | Dùng cho                      |
| -------------------- | --------- | ----------------------------- |
| `var(--os-accent)`   | `#6c63ff` | Màu chính, bar/line mặc định  |
| `var(--os-green)`    | `#3dd68c` | Trạng thái tốt, đã hoàn thành |
| `var(--os-red)`      | `#ff5f5f` | Cảnh báo, quá hạn, overloaded |
| `var(--os-muted)`    | `#5e5e78` | Axis tick, label phụ          |
| `var(--os-text2)`    | `#a0a0bc` | Label chính trên axis         |
| `var(--os-surface)`  | `#0f0f17` | Card background               |
| `var(--os-surface2)` | `#17171f` | Track nền donut, cursor hover |
| `var(--os-border)`   | `#252535` | CartesianGrid, border tooltip |
| `#f59e0b`            | amber     | Medium severity, warning      |
| `#f97316`            | orange    | High severity (bugs)          |

---

## Shared Components

### `ScoreDonut` — Radial score chart

**File:** `src/components/shared/ScoreDonut.tsx`
**Dùng cho:** Budget health, Task quality, Bug quality, Risk score, Team health

```tsx
import { ScoreDonut } from '@/components/shared/ScoreDonut';

<ScoreDonut
  title='Chất lượng dự án'
  score={qualityScore} // 0-100
  color={qualityLabel.color} // CSS variable hoặc hex
  label={qualityLabel.text} // Nhãn trạng thái
  description='Mô tả ngắn'
  warnText={count > 0 ? `${count} item cần xử lý` : undefined}
/>;
```

**Props:**

- `score: number` — giá trị 0–100
- `color: string` — màu arc chính
- `label: string` — nhãn bên dưới donut
- `title: string` — tiêu đề card
- `description: string` — mô tả nhỏ bên dưới
- `warnText?: string` — text cảnh báo đỏ, ẩn nếu undefined

Component tự render `col-span-4` trong grid 12 cols.

---

### `BreakdownBarChart` — Horizontal bar breakdown

**File:** `src/components/shared/BreakdownBarChart.tsx`
**Dùng cho:** Breakdown theo trạng thái, mức độ, ưu tiên

```tsx
import { BreakdownBarChart } from '@/components/shared/BreakdownBarChart';

<BreakdownBarChart
  title='Theo trạng thái'
  items={[
    { name: 'Open', value: 5, color: 'var(--os-red)' },
    { name: 'Done', value: 8, color: 'var(--os-green)' },
  ]}
/>;
```

**Props:**

- `title: string`
- `items: { name: string; value: number; color: string }[]`

Tự động tính chiều cao theo số items: `items.length * 28 + 16px`.
Component tự render `col-span-4` trong grid 12 cols.

---

## Patterns Từng Loại Chart

### AreaChart — Burndown / trend line

**File:** `src/modules/reports/components/BurndownChart.tsx`

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Gradient fill
<defs>
  <linearGradient id='burndownGrad' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='5%'  stopColor='var(--os-accent)' stopOpacity={0.25} />
    <stop offset='95%' stopColor='var(--os-accent)' stopOpacity={0} />
  </linearGradient>
</defs>

<CartesianGrid strokeDasharray='3 3' stroke='var(--os-border)' vertical={false} />
<XAxis tick={{ fill: 'var(--os-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
<YAxis tick={{ fill: 'var(--os-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />

<Area
  type='monotone' dataKey='remaining'
  stroke='var(--os-accent)' strokeWidth={2}
  fill='url(#burndownGrad)'
  dot={{ r: 3.5, fill: 'var(--os-accent)', strokeWidth: 0 }}
  activeDot={{ r: 5, fill: 'var(--os-accent)', stroke: 'var(--os-surface)', strokeWidth: 2 }}
  animationDuration={800} animationEasing='ease-out'
/>
```

---

### PieChart (donut) — Phân bổ theo danh mục

**File:** `src/modules/team/components/TeamStatsPanel.tsx` — "Theo trạng thái"

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = items.map((s) => ({ name: s.label, value: s.count, color: s.color })).filter((d) => d.value > 0);

<ResponsiveContainer width='100%' height={110}>
  <PieChart>
    <Pie data={data} cx='50%' cy='50%' innerRadius={32} outerRadius={50} paddingAngle={3} dataKey='value' animationBegin={0} animationDuration={800} animationEasing='ease-out' strokeWidth={0}>
      {data.map((d, i) => (
        <Cell key={i} fill={d.color} />
      ))}
    </Pie>
    <Tooltip content={<CustomTooltip />} />
  </PieChart>
</ResponsiveContainer>;

{
  /* Legend bên dưới — grid 2 cols */
}
<div className='grid grid-cols-2 gap-x-3 gap-y-1 mt-1'>
  {items.map((s) => (
    <div key={s.key} className='flex items-center gap-1.5'>
      <span className='w-2 h-2 rounded-full shrink-0' style={{ background: s.color }} />
      <span className='text-[12px] text-(--os-text2) truncate'>{s.label}</span>
      <span className='font-mono-dm text-[12px] text-(--os-muted) ml-auto'>{count}</span>
    </div>
  ))}
</div>;
```

---

### BarChart horizontal — Workload / comparison

**File:** `src/modules/team/components/TeamStatsPanel.tsx` — "Workload thành viên"

```tsx
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width='100%' height={members.length * 30 + 8}>
  <BarChart layout='vertical' data={data} margin={{ top: 0, right: 28, left: 0, bottom: 0 }} barCategoryGap='30%'>
    <CartesianGrid strokeDasharray='3 3' stroke='var(--os-border)' horizontal={false} />
    <XAxis type='number' domain={[0, 100]} tick={{ fill: 'var(--os-muted)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
    <YAxis type='category' dataKey='name' tick={{ fill: 'var(--os-text2)', fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--os-surface2)' }} />
    <Bar dataKey='value' radius={[0, 4, 4, 0]} animationDuration={700} animationEasing='ease-out'>
      {data.map((d, i) => (
        <Cell key={i} fill={d.color} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>;
```

---

### BarChart vertical — Activity type breakdown

**File:** `src/modules/activity/components/ActivityStatsPanel.tsx` — "Activity type distribution"

```tsx
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width='100%' height={240}>
  <BarChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray='3 3' stroke='var(--os-border)' vertical={false} />
    <XAxis dataKey='name' tick={{ fill: 'var(--os-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: 'var(--os-muted)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--os-surface2)' }} />
    <Bar dataKey='value' radius={[4, 4, 0, 0]} animationDuration={700} animationEasing='ease-out'>
      {data.map((d, i) => (
        <Cell key={i} fill={d.color} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>;
```

Data shape:

```tsx
interface ActivityTypeData {
  name: string; // 'Tasks' | 'Bugs' | 'Sprints' | 'Meetings'
  value: number; // count of activities
  color: string; // CSS variable (--os-accent, --os-green, etc.)
}
```

---

## Custom Tooltip — Pattern chuẩn

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

## Animation Settings Chuẩn

| Prop                | Giá trị      | Ghi chú                             |
| ------------------- | ------------ | ----------------------------------- |
| `animationBegin`    | `0`          | Bắt đầu ngay khi mount              |
| `animationDuration` | `700–900`    | 700ms bar, 800ms area, 900ms radial |
| `animationEasing`   | `'ease-out'` | Mượt, không bouncy                  |

---

## Quy tắc Chung

1. **Luôn dùng `ResponsiveContainer`** — không hardcode width/height ngoại trừ trong container tương đối
2. **`axisLine={false}` và `tickLine={false}`** trên mọi axis — không vẽ đường kẻ thừa
3. **Không dùng `Legend` mặc định của Recharts** — tự render legend HTML để kiểm soát style
4. **`cursor={{ fill: 'var(--os-surface2)' }}`** trên `<Tooltip>` của BarChart horizontal
5. **Gradient fill** cho AreaChart: `stopOpacity` từ 0.25 → 0
6. **`strokeWidth={0}`** trên `<Pie>` để bỏ viền trắng giữa các slice
7. **`padding={{ top: 0 }}`** hoặc `margin` nhỏ để tránh chart bị cắt
