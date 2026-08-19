import type { Category, RoutingRule, WorkflowStep, Ticket } from '../types';

export const ROUTING_RULES: RoutingRule[] = [
  { id: 'r1', category: 'IT', department: 'IT Service Desk', approverRole: 'IT Manager', approverEmail: 'it.manager@nexusdesk.io', autoEscalate: true, slaHours: 4 },
  { id: 'r2', category: 'HR', department: 'Human Resources', approverRole: 'HR Director', approverEmail: 'hr.director@nexusdesk.io', autoEscalate: false, slaHours: 8 },
  { id: 'r3', category: 'Finance', department: 'Finance Operations', approverRole: 'Finance Business Partner', approverEmail: 'finance.bp@nexusdesk.io', autoEscalate: true, slaHours: 6 },
  { id: 'r4', category: 'Operations', department: 'Operations & Facilities', approverRole: 'Operations Lead', approverEmail: 'ops.lead@nexusdesk.io', autoEscalate: false, slaHours: 12 },
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 's1', label: 'Intake', description: 'Ticket submitted and received by the system', icon: 'Inbox', automated: false },
  { id: 's2', label: 'AI Classification', description: 'Category, priority and department assigned by classifier', icon: 'Sparkles', automated: true },
  { id: 's3', label: 'Auto-Routing', description: 'Ticket routed to the correct department queue', icon: 'GitBranch', automated: true },
  { id: 's4', label: 'Notification', description: 'Email alert sent to assignee and requester', icon: 'Mail', automated: true },
  { id: 's5', label: 'Approval Check', description: 'High-value or sensitive tickets flagged for approval', icon: 'CheckSquare', automated: true },
  { id: 's6', label: 'Resolution', description: 'Ticket resolved and closed with audit trail', icon: 'CheckCircle2', automated: false },
];

export function getRoutingRule(category: Category): RoutingRule {
  return ROUTING_RULES.find((r) => r.category === category) || ROUTING_RULES[0];
}

export function requiresApproval(ticket: Pick<Ticket, 'priority' | 'risk_score' | 'category'>): boolean {
  if (ticket.priority === 'Critical') return true;
  if (ticket.risk_score >= 35) return true;
  if (ticket.category === 'Finance' && ticket.priority === 'High') return true;
  return false;
}

export function buildNotification(
  ticket: Pick<Ticket, 'subject' | 'category' | 'priority' | 'department'>,
  trigger: string,
  _recipient: string,
  ticketRef: string,
): { subject: string; body: string } {
  const subjects: Record<string, string> = {
    AUTO_ROUTE: `[${ticketRef}] New ${ticket.category} ticket routed to ${ticket.department}`,
    ESCALATION: `[${ticketRef}] ESCALATION: ${ticket.priority} priority ticket requires immediate attention`,
    APPROVAL_REQUEST: `[${ticketRef}] Approval required for ${ticket.priority} priority ${ticket.category} request`,
    APPROVAL_RESULT: `[${ticketRef}] Approval decision recorded for ticket`,
    STATUS_CHANGE: `[${ticketRef}] Ticket status updated`,
    SLA_WARNING: `[${ticketRef}] SLA warning: response time approaching threshold`,
  };

  const bodies: Record<string, string> = {
    AUTO_ROUTE: `A new ticket has been automatically classified and routed to ${ticket.department}.\n\nSubject: ${ticket.subject}\nPriority: ${ticket.priority}\nCategory: ${ticket.category}\n\nPlease review and action at your earliest convenience.`,
    ESCALATION: `Ticket ${ticketRef} has been escalated due to ${ticket.priority} priority.\n\nSubject: ${ticket.subject}\n\nImmediate action is required. This ticket has bypassed the standard queue and been assigned to senior support.`,
    APPROVAL_REQUEST: `An approval request has been raised for ticket ${ticketRef}.\n\nSubject: ${ticket.subject}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}\n\nPlease review and approve or reject via the NexusDesk AI platform.`,
    APPROVAL_RESULT: `The approval decision for ticket ${ticketRef} has been recorded.\n\nSubject: ${ticket.subject}\n\nThe requester has been notified and the ticket status updated accordingly.`,
    STATUS_CHANGE: `The status of ticket ${ticketRef} has been updated.\n\nSubject: ${ticket.subject}\n\nPlease check the platform for the latest state.`,
    SLA_WARNING: `Ticket ${ticketRef} is approaching its SLA threshold.\n\nSubject: ${ticket.subject}\nPriority: ${ticket.priority}\n\nAction is required to maintain service level compliance.`,
  };

  return {
    subject: subjects[trigger] || `[${ticketRef}] Notification`,
    body: bodies[trigger] || `Notification for ticket ${ticketRef}: ${ticket.subject}`,
  };
}

export function extractAmount(body: string): number | null {
  const matches = body.match(/(?:£|gbp\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/i);
  if (matches && matches[1]) {
    const value = parseFloat(matches[1].replace(/,/g, ''));
    if (!isNaN(value) && value > 0) return value;
  }
  const budgetMatch = body.match(/budget[^]*?(\d{3,})/i);
  if (budgetMatch && budgetMatch[1]) {
    const value = parseFloat(budgetMatch[1].replace(/,/g, ''));
    if (!isNaN(value) && value > 0) return value;
  }
  return null;
}
