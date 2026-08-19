export type Category = 'HR' | 'IT' | 'Finance' | 'Operations';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Tone = 'formal' | 'friendly' | 'urgent';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated';

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  category: Category;
  priority: Priority;
  confidence: number;
  matched_keywords: string[];
  tone: Tone;
  ai_response: string | null;
  status: TicketStatus;
  risk_flags: string[];
  risk_score: number;
  response_time_ms: number;
  department: string | null;
  bias_flags: string[];
  created_at: string;
  user_id?: string | null;
}

export interface BiasCheck {
  detected: boolean;
  flags: string[];
  note: string;
}

export interface ClassificationResult {
  category: Category;
  priority: Priority;
  confidence: number;
  matchedKeywords: string[];
  department: string;
  biasCheck: BiasCheck;
  relevant: boolean;
}

export interface RiskResult {
  riskScore: number;
  riskFlags: string[];
  notes: string[];
}

export interface ForecastPoint {
  label: string;
  historical: number;
  projected: number;
}

export interface AuditLog {
  id: string;
  ticket_id: string | null;
  action: string;
  actor: string;
  detail: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type NotificationChannel = 'Email' | 'SMS' | 'In-App' | 'Webhook';
export type NotificationStatus = 'Queued' | 'Sent' | 'Delivered' | 'Failed';
export type WorkflowTrigger = 'AUTO_ROUTE' | 'ESCALATION' | 'APPROVAL_REQUEST' | 'APPROVAL_RESULT' | 'STATUS_CHANGE' | 'SLA_WARNING';

export interface Approval {
  id: string;
  ticket_id: string;
  approver_role: string;
  department: string | null;
  status: ApprovalStatus;
  reason: string | null;
  priority: Priority;
  amount: number | null;
  created_at: string;
  resolved_at: string | null;
}

export interface NotificationRecord {
  id: string;
  ticket_id: string | null;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  trigger: string;
  created_at: string;
}

export interface RoutingRule {
  id: string;
  category: Category;
  department: string;
  approverRole: string;
  approverEmail: string;
  autoEscalate: boolean;
  slaHours: number;
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  automated: boolean;
}

export type ViewKey =
  | 'dashboard'
  | 'tickets'
  | 'analytics'
  | 'report'
  | 'forecast'
  | 'compliance'
  | 'workflows'
  | 'deliverables'
  | 'week8';
