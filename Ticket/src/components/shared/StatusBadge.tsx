import type { TicketStatus } from '../../types';
import { STATUS_LABELS } from '../../types';

const styleMap: Record<TicketStatus, string> = {
  new: 'bg-blue-500/18 text-blue-300 border-blue-500/30',
  assigned: 'bg-purple-500/18 text-purple-300 border-purple-500/30',
  in_progress: 'bg-amber-500/18 text-amber-300 border-amber-500/30',
  waiting_user: 'bg-orange-500/18 text-orange-300 border-orange-500/30',
  resolved: 'bg-green-500/18 text-green-300 border-green-500/30',
  closed: 'bg-slate-500/18 text-slate-400 border-slate-500/30',
  reopened: 'bg-red-500/18 text-red-300 border-red-500/30',
};

const dotMap: Record<TicketStatus, string> = {
  new: 'bg-blue-400',
  assigned: 'bg-purple-400',
  in_progress: 'bg-amber-400',
  waiting_user: 'bg-orange-400',
  resolved: 'bg-green-400',
  closed: 'bg-slate-400',
  reopened: 'bg-red-400',
};

interface Props {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 ${padding} font-medium rounded border ${styleMap[status]} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status]} flex-shrink-0`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
