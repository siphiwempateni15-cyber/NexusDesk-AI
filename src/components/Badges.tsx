import type { Category, Priority, TicketStatus } from '../types';
import { CATEGORY_META, PRIORITY_META, STATUS_META } from '../lib/ui';

export function CategoryBadge({ category }: { category: Category }) {
  const m = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${m.bg} ${m.color}`}>
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${m.bg} ${m.color}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${m.bg} ${m.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  );
}
