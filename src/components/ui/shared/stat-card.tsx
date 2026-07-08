import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatColor = 'accent' | 'red' | 'green' | 'yellow' | 'purple';
type DeltaType = 'positive' | 'negative' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: DeltaType;
  color?: StatColor;
}

const topBar: Record<StatColor, string> = {
  accent: 'bg-primary',
  red: 'bg-red-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
};

const deltaColor: Record<DeltaType, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-muted-foreground',
};

export function StatCard({ label, value, delta, deltaType = 'positive', color = 'accent' }: StatCardProps) {
  return (
    <Card className='relative overflow-hidden from-primary/5 to-card bg-linear-to-t shadow-xs dark:bg-card'>
      <div className={cn('absolute inset-x-0 top-0 h-0.5', topBar[color])} />
      <CardHeader className='pb-3'>
        <CardDescription className='font-mono-dm uppercase tracking-[1.5px]'>{label}</CardDescription>
        <CardTitle className='text-[36px] leading-[1.1] tracking-[-0.5px]'>{value}</CardTitle>
      </CardHeader>
      {delta && (
        <CardContent>
          <div className={cn('text-[13px]', deltaColor[deltaType])}>{delta}</div>
        </CardContent>
      )}
    </Card>
  );
}
