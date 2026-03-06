import type { Priority } from '../types';
import clsx from 'clsx';

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700 font-semibold',
};

const PRIORITY_DOTS: Record<Priority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

interface Props {
  priority: Priority;
  size?: 'sm' | 'md';
}

export default function PriorityBadge({ priority, size = 'md' }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full capitalize',
        PRIORITY_STYLES[priority],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', PRIORITY_DOTS[priority])} />
      {priority}
    </span>
  );
}
