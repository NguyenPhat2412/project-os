import * as ProgressPrimitive from '@radix-ui/react-progress';
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  className?: string;
  noMargin?: boolean;
}

export function ProgressBar({ label, value, suffix, color = 'var(--primary)', className, noMargin }: ProgressBarProps) {
  const display = suffix ?? `${value}%`;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <ProgressPrimitive.Root value={clamped} max={100} className={cn(noMargin ? '' : 'mb-3.5', className)}>
      {(label || display) && (
        <div className='flex justify-between items-center text-[13px] mb-1.5'>
          <span>{label}</span>
          <span className='font-mono-dm text-[12px] text-muted-foreground'>{display}</span>
        </div>
      )}
      <ProgressTrack className='h-1.5 bg-muted rounded-0.75'>
        <ProgressIndicator className='h-full rounded-0.75 transition-[width] duration-1000' style={{ width: `${clamped}%`, background: color }} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}
