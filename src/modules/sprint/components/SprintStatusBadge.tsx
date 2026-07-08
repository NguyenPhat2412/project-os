'use client';

import type { Sprint } from '@/modules/sprint/types/sprint';

const STATUS_META = {
  planned: { label: 'Planned', color: '#6b7280', bg: 'bg-[#6b7280]/10', text: 'text-[#9ca3af]' },
  active: { label: 'Active', color: '#6c63ff', bg: 'bg-[#6c63ff]/15', text: 'text-[#a78bfa]' },
  completed: { label: 'Completed', color: '#22c55e', bg: 'bg-[#22c55e]/10', text: 'text-[#4ade80]' },
} as const;

interface Props {
  status: Sprint['status'];
}

export function SprintStatusBadge({ status }: Props) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-dm font-semibold uppercase tracking-[0.6px] ${m.bg} ${m.text}`}>
      <span className='w-1.5 h-1.5 rounded-full shrink-0' style={{ background: m.color }} />
      {m.label}
    </span>
  );
}
