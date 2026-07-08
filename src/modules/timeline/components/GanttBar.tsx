interface GanttBarProps {
  rowLabel: string;
  label: string;
  leftPercent: number;
  widthPercent: number;
  color: string;
}

export function GanttBar({ rowLabel, label, leftPercent, widthPercent, color }: GanttBarProps) {
  return (
    <div className='grid gap-1 items-center mb-1.25' style={{ gridTemplateColumns: '160px 1fr' }}>
      <div className='text-[12.5px] font-medium pr-2.5 whitespace-nowrap overflow-hidden text-ellipsis text-muted-foreground'>{rowLabel}</div>
      <div className='relative h-10 bg-secondary panel-inner overflow-hidden'>
        <div className='absolute top-1 h-8 rounded-sm flex items-center px-2 text-[12px] font-bold whitespace-nowrap overflow-hidden text-ellipsis' style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, background: color, color: 'rgba(0,0,0,0.8)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
