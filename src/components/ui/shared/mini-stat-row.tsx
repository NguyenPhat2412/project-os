interface MiniStat {
  value: string | number;
  label: string;
  color?: string;
  bgColor?: string;
}
interface MiniStatRowProps {
  stats: MiniStat[];
}

export function MiniStatRow({ stats }: MiniStatRowProps) {
  return (
    <div className='flex gap-2.5 mb-3.5'>
      {stats.map((s, i) => (
        <div key={i} className='flex-1 rounded-1.5 px-3 py-2.5 text-center' style={{ background: s.bgColor ?? 'var(--secondary)' }}>
          <div className='text-[26px] font-bold leading-[1.1] mb-0.75 tracking-[-0.3px]' style={{ color: s.color }}>
            {s.value}
          </div>
          <div className='font-mono-dm text-[10px] text-muted-foreground uppercase tracking-[1.2px]'>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
