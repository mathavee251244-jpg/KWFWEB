import type { TicketPriority } from '../../types';
import { PRIORITY_LABELS } from '../../types';

const styleMap: Record<TicketPriority, string> = {
  low: 'bg-green-500/15 text-green-300 border-green-500/25',
  medium: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  critical: 'bg-red-500/20 text-red-300 border-red-500/35',
};

const iconMap: Record<TicketPriority, string> = {
  low: '▽',
  medium: '◈',
  high: '▲',
  critical: '⚠',
};

interface Props {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export default function PriorityBadge({ priority, size = 'md' }: Props) {
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 ${padding} font-medium rounded border ${styleMap[priority]} whitespace-nowrap`}>
      <span className="text-[9px]">{iconMap[priority]}</span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
