import type { BugSeverity } from '@/modules/bugs/types/bug';
import type { Priority } from '@/modules/tasks/types/task';

export type WorkItemBadgeVariant = 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';

export const TASK_PRIORITY_VALUES: Priority[] = ['High', 'Normal', 'Low'];
export const BUG_SEVERITY_VALUES: BugSeverity[] = ['Critical', 'High', 'Medium', 'Low'];

export const TASK_PRIORITY_META: Record<
  Priority,
  {
    badgeVariant: WorkItemBadgeVariant;
    textClass: string;
    softClass: string;
    solidClass: string;
    chartColor: string;
  }
> = {
  High: {
    badgeVariant: 'red',
    textClass: 'text-red-600',
    softClass: 'bg-red-500/15 text-red-600',
    solidClass: 'bg-[color:oklch(0.577_0.245_27.325)]/80 text-white',
    chartColor: 'oklch(0.577 0.245 27.325)',
  },
  Normal: {
    badgeVariant: 'green',
    textClass: 'text-green-600',
    softClass: 'bg-green-500/15 text-green-600',
    solidClass: 'bg-[color:oklch(0.646_0.222_142.116)]/80 text-white',
    chartColor: 'oklch(0.646 0.222 142.116)',
  },
  Low: {
    badgeVariant: 'yellow',
    textClass: 'text-yellow-600',
    softClass: 'bg-yellow-500/15 text-yellow-600',
    solidClass: 'bg-[color:oklch(0.769_0.188_70.08)]/80 text-zinc-950',
    chartColor: 'oklch(0.769 0.188 70.08)',
  },
};

export const BUG_SEVERITY_META: Record<
  BugSeverity,
  {
    badgeVariant: WorkItemBadgeVariant;
    textClass: string;
    activeColor: string;
    chartColor: string;
  }
> = {
  Critical: {
    badgeVariant: 'purple',
    textClass: 'text-violet-600',
    activeColor: '#8b5cf6',
    chartColor: '#8b5cf6',
  },
  High: {
    badgeVariant: 'red',
    textClass: 'text-red-600',
    activeColor: 'oklch(0.577 0.245 27.325)',
    chartColor: 'oklch(0.577 0.245 27.325)',
  },
  Medium: {
    badgeVariant: 'yellow',
    textClass: 'text-yellow-600',
    activeColor: '#f59e0b',
    chartColor: '#f59e0b',
  },
  Low: {
    badgeVariant: 'green',
    textClass: 'text-green-600',
    activeColor: 'oklch(0.646 0.222 142.116)',
    chartColor: 'oklch(0.646 0.222 142.116)',
  },
};
