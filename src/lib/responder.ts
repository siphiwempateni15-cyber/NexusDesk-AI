import type { Category, Priority } from '../types';

interface ResponseContext {
  category: Category;
  priority: Priority;
  subject: string;
  ticketRef: string;
  customerName: string;
  biasDetected: boolean;
}

const CATEGORY_BODY: Record<Category, string> = {
  IT: 'Your request has been routed to the IT Service Desk. A technician will review the details and contact you with next steps. If this is affecting business-critical work, please flag the urgency to your line manager so we can prioritise accordingly.',
  HR: 'Your request has been received by the HR Operations team. We will review the details and respond within the standard HR service window. If your query is time-sensitive, please reference this ticket when contacting the HR helpdesk.',
  Finance: 'Your finance request has been logged with the Finance Operations team. Please ensure all supporting documentation is attached in the finance portal so we can process without delay. You will receive a status update within the standard turnaround.',
  Operations: 'Your facilities request has been received by the Operations team. A coordinator will assess the issue and arrange the appropriate response. Thank you for helping us keep the workplace running smoothly.',
};

const PRIORITY_NOTE: Record<Priority, string> = {
  Low: 'This has been queued as a low-priority item and will be addressed in the next service cycle.',
  Medium: 'This has been assigned standard priority and you can expect a response within 1-2 working days.',
  High: 'This has been marked high priority and will be actioned within 4 working hours.',
  Critical: 'This has been escalated as a critical incident. The on-duty team has been notified and will respond immediately.',
};

function greeting(name: string): string {
  const clean = name.trim();
  if (!clean) return 'Thank you for contacting the service desk.';
  const first = clean.split(/\s+/)[0];
  return `Dear ${first},`;
}

export function generateResponse(ctx: ResponseContext): string {
  const lines = [
    greeting(ctx.customerName),
    '',
    `Thank you for contacting the service desk regarding "${ctx.subject}". Your request has been logged under reference ${ctx.ticketRef}.`,
    '',
    CATEGORY_BODY[ctx.category],
    '',
    PRIORITY_NOTE[ctx.priority],
    '',
  ];
  if (ctx.biasDetected) {
    lines.push('Please note: our review team will follow up directly to ensure your request is handled fairly and inclusively.');
    lines.push('');
  }
  lines.push(`You can track progress on this ticket at any time. If you have additional information that may help us resolve this faster, please reply to this ticket and quote reference ${ctx.ticketRef}.`);
  lines.push('');
  lines.push('Kind regards,');
  lines.push(`${ctx.category} Service Team`);
  return lines.join('\n');
}
