import { useMemo, useState } from 'react';
import {
  Workflow, GitBranch, Mail, CheckSquare, CheckCircle2, Inbox, Sparkles,
  ArrowRight, Clock, AlertTriangle, Bell, Send, Loader2, X, PenSquare,
} from 'lucide-react';
import type { Ticket, Approval, NotificationRecord, ApprovalStatus } from '../types';
import { supabase } from '../lib/supabase';
import {
  ROUTING_RULES, WORKFLOW_STEPS, getRoutingRule, requiresApproval,
  buildNotification, extractAmount,
} from '../lib/workflow';
import { sendEmail, sendNotificationEmail, type SendEmailResult } from '../lib/email';
import { CategoryBadge, PriorityBadge } from '../components/Badges';
import { StatCard } from '../components/StatCard';
import { timeAgo } from '../lib/ui';

interface WorkflowsProps {
  tickets: Ticket[];
  approvals: Approval[];
  notifications: NotificationRecord[];
  loadingApprovals: boolean;
  loadingNotifications: boolean;
  onReloadApprovals: () => void;
  onReloadNotifications: () => void;
  onReloadTickets: () => void;
}

const STEP_ICONS: Record<string, typeof Inbox> = {
  Inbox, Sparkles, GitBranch, Mail, CheckSquare, CheckCircle2,
};

const CHANNEL_META: Record<string, { color: string; bg: string; icon: typeof Mail }> = {
  Email: { color: 'text-accent-300', bg: 'bg-accent-500/10 border-accent-500/30', icon: Mail },
  SMS: { color: 'text-good-400', bg: 'bg-good-500/10 border-good-500/30', icon: Send },
  'In-App': { color: 'text-brand-300', bg: 'bg-brand-500/10 border-brand-500/30', icon: Bell },
  Webhook: { color: 'text-warn-400', bg: 'bg-warn-500/10 border-warn-500/30', icon: GitBranch },
};

const NOTIF_STATUS_META: Record<string, { color: string; dot: string }> = {
  Queued: { color: 'text-slate-400', dot: 'bg-slate-400' },
  Sent: { color: 'text-accent-300', dot: 'bg-accent-400' },
  Delivered: { color: 'text-good-400', dot: 'bg-good-400' },
  Failed: { color: 'text-danger-400', dot: 'bg-danger-400' },
};

const APPROVAL_STATUS_META: Record<ApprovalStatus, { color: string; bg: string; dot: string }> = {
  Pending: { color: 'text-warn-400', bg: 'bg-warn-500/15 border-warn-500/30', dot: 'bg-warn-400' },
  Approved: { color: 'text-good-400', bg: 'bg-good-500/15 border-good-500/30', dot: 'bg-good-400' },
  Rejected: { color: 'text-danger-400', bg: 'bg-danger-500/15 border-danger-500/30', dot: 'bg-danger-400' },
};

export function Workflows({
  tickets, approvals, notifications, loadingApprovals, loadingNotifications,
  onReloadApprovals, onReloadNotifications, onReloadTickets,
}: WorkflowsProps) {
  const [tab, setTab] = useState<'pipeline' | 'routing' | 'approvals' | 'notifications'>('pipeline');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [processingApproval, setProcessingApproval] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<Record<string, SendEmailResult | null>>({});
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = approvals.filter((a) => a.status === 'Pending').length;
    const approved = approvals.filter((a) => a.status === 'Approved').length;
    const rejected = approvals.filter((a) => a.status === 'Rejected').length;
    const sentNotifs = notifications.filter((n) => n.status === 'Sent' || n.status === 'Delivered').length;
    const autoRouted = tickets.filter((t) => t.department).length;
    return { pending, approved, rejected, sentNotifs, autoRouted };
  }, [approvals, notifications, tickets]);

  async function runAutomation() {
    setRunning(true);
    setRunResult(null);
    const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'Escalated');
    let routed = 0;
    let notifsCreated = 0;
    let approvalsCreated = 0;

    for (const ticket of openTickets) {
      const rule = getRoutingRule(ticket.category);
      const ticketRef = `ND-${ticket.id.slice(0, 4).toUpperCase()}`;

      if (!ticket.department) {
        await supabase.from('tickets').update({ department: rule.department }).eq('id', ticket.id);
        routed++;
      }

      const { subject, body } = buildNotification(ticket, 'AUTO_ROUTE', rule.approverEmail, ticketRef);
      const { data: notifData } = await supabase.from('notification_log').insert({
        ticket_id: ticket.id,
        channel: 'Email',
        recipient: rule.approverEmail,
        subject,
        body,
        status: 'Sent',
        trigger: 'AUTO_ROUTE',
      }).select('id').single();
      if (notifData) {
        notifsCreated++;
        sendNotificationEmail({ recipient: rule.approverEmail, subject, body }).then((res) => {
          if (res.success) {
            supabase.from('notification_log').update({ status: 'Delivered' }).eq('id', notifData.id);
          } else {
            supabase.from('notification_log').update({ status: 'Failed' }).eq('id', notifData.id);
          }
        });
      }

      if (requiresApproval(ticket)) {
        const existing = approvals.find((a) => a.ticket_id === ticket.id && a.status === 'Pending');
        if (!existing) {
          const amount = extractAmount(ticket.body);
          const { error: apprError } = await supabase.from('approvals').insert({
            ticket_id: ticket.id,
            approver_role: rule.approverRole,
            department: rule.department,
            status: 'Pending',
            priority: ticket.priority,
            amount,
          });
          if (!apprError) {
            approvalsCreated++;
            const { subject: apprSubj, body: apprBody } = buildNotification(ticket, 'APPROVAL_REQUEST', rule.approverEmail, ticketRef);
            const { data: apprNotifData } = await supabase.from('notification_log').insert({
              ticket_id: ticket.id,
              channel: 'Email',
              recipient: rule.approverEmail,
              subject: apprSubj,
              body: apprBody,
              status: 'Sent',
              trigger: 'APPROVAL_REQUEST',
            }).select('id').single();
            if (apprNotifData) {
              notifsCreated++;
              sendNotificationEmail({ recipient: rule.approverEmail, subject: apprSubj, body: apprBody }).then((res) => {
                if (res.success) {
                  supabase.from('notification_log').update({ status: 'Delivered' }).eq('id', apprNotifData.id);
                } else {
                  supabase.from('notification_log').update({ status: 'Failed' }).eq('id', apprNotifData.id);
                }
              });
            }
          }
        }
      }

      if (ticket.priority === 'Critical' && ticket.status !== 'Escalated') {
        await supabase.from('tickets').update({ status: 'Escalated' }).eq('id', ticket.id);
        const { subject: escSubj, body: escBody } = buildNotification(ticket, 'ESCALATION', rule.approverEmail, ticketRef);
        const { data: escNotifData } = await supabase.from('notification_log').insert({
          ticket_id: ticket.id,
          channel: 'Email',
          recipient: rule.approverEmail,
          subject: escSubj,
          body: escBody,
          status: 'Sent',
          trigger: 'ESCALATION',
        }).select('id').single();
        if (escNotifData) {
          notifsCreated++;
          sendNotificationEmail({ recipient: rule.approverEmail, subject: escSubj, body: escBody }).then((res) => {
            if (res.success) {
              supabase.from('notification_log').update({ status: 'Delivered' }).eq('id', escNotifData.id);
            } else {
              supabase.from('notification_log').update({ status: 'Failed' }).eq('id', escNotifData.id);
            }
          });
        }
      }

      await supabase.from('audit_logs').insert({
        ticket_id: ticket.id,
        action: 'AUTO_ROUTED',
        actor: 'Workflow Automation Engine',
        detail: `Routed to ${rule.department} — SLA ${rule.slaHours}h — Approver: ${rule.approverRole}`,
        metadata: { department: rule.department, slaHours: rule.slaHours, approver: rule.approverRole },
      });
    }

    setRunning(false);
    setRunResult(`Processed ${openTickets.length} open tickets: ${routed} routed, ${notifsCreated} notifications sent, ${approvalsCreated} approval requests created.`);
    onReloadApprovals();
    onReloadNotifications();
    onReloadTickets();
  }

  async function processApproval(approval: Approval, decision: ApprovalStatus, reason: string) {
    setProcessingApproval(approval.id);
    const { error } = await supabase.from('approvals').update({
      status: decision,
      reason: reason || null,
      resolved_at: new Date().toISOString(),
    }).eq('id', approval.id);

    if (!error) {
      const ticket = tickets.find((t) => t.id === approval.ticket_id);
      if (ticket) {
        const newStatus = decision === 'Approved' ? 'In Progress' : 'Escalated';
        await supabase.from('tickets').update({ status: newStatus }).eq('id', ticket.id);
        const ticketRef = `ND-${ticket.id.slice(0, 4).toUpperCase()}`;
        const { subject, body } = buildNotification(ticket, 'APPROVAL_RESULT', approval.approver_role, ticketRef);
        const recipient = ticket.department || 'service.desk@nexusdesk.io';
        const { data: apprResultNotif } = await supabase.from('notification_log').insert({
          ticket_id: ticket.id,
          channel: 'Email',
          recipient,
          subject,
          body,
          status: 'Sent',
          trigger: 'APPROVAL_RESULT',
        }).select('id').single();
        if (apprResultNotif) {
          sendNotificationEmail({ recipient, subject, body }).then((res) => {
            if (res.success) {
              supabase.from('notification_log').update({ status: 'Delivered' }).eq('id', apprResultNotif.id);
            } else {
              supabase.from('notification_log').update({ status: 'Failed' }).eq('id', apprResultNotif.id);
            }
          });
        }
        await supabase.from('audit_logs').insert({
          ticket_id: ticket.id,
          action: 'APPROVAL_DECISION',
          actor: approval.approver_role,
          detail: `Approval ${decision.toLowerCase()}${reason ? ` — ${reason}` : ''}`,
          metadata: { decision, reason },
        });
      }
      onReloadApprovals();
      onReloadNotifications();
      onReloadTickets();
    }
    setProcessingApproval(null);
  }

  async function sendSingleEmail(notification: NotificationRecord) {
    setSendingEmail(notification.id);
    const result = await sendNotificationEmail({
      recipient: notification.recipient,
      subject: notification.subject,
      body: notification.body,
    });
    setEmailStatus((prev) => ({ ...prev, [notification.id]: result }));
    if (result.success) {
      await supabase.from('notification_log').update({ status: 'Delivered' }).eq('id', notification.id);
    } else {
      await supabase.from('notification_log').update({ status: 'Failed' }).eq('id', notification.id);
    }
    setSendingEmail(null);
    onReloadNotifications();
  }

  async function sendBulkEmails() {
    setBulkSending(true);
    setBulkResult(null);
    const unsent = notifications.filter((n) => n.status === 'Queued' || n.status === 'Sent' || n.status === 'Failed');
    let sent = 0;
    let failed = 0;
    for (const n of unsent) {
      const result = await sendNotificationEmail({
        recipient: n.recipient,
        subject: n.subject,
        body: n.body,
      });
      if (result.success) {
        await supabase.from('notification_log').update({ status: 'Delivered' }).eq('id', n.id);
        sent++;
      } else {
        await supabase.from('notification_log').update({ status: 'Failed' }).eq('id', n.id);
        failed++;
      }
    }
    setBulkSending(false);
    setBulkResult(`Sent ${sent} email${sent !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}.${failed > 0 ? ' Ensure RESEND_API_KEY is configured for delivery.' : ''}`);
    onReloadNotifications();
  }

  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');
  const resolvedApprovals = approvals.filter((a) => a.status !== 'Pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-ink-700/40 bg-gradient-to-br from-ink-850 to-ink-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-2.5">
              <Workflow size={22} className="text-brand-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Workflow Automation</h2>
              <p className="mt-0.5 text-sm text-slate-400">End-to-end ticket routing, notifications and approval orchestration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEmailModal(true)}
              className="flex items-center gap-2 rounded-xl border border-ink-700/50 bg-ink-850 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-brand-500/40 hover:text-brand-300"
            >
              <PenSquare size={16} />
              Compose Email
            </button>
            <button
              onClick={runAutomation}
              disabled={running}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {running ? 'Running...' : 'Run Automation Engine'}
            </button>
          </div>
        </div>
        {runResult && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-good-500/30 bg-good-500/10 p-3 text-sm text-good-400">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{runResult}</span>
            <button onClick={() => setRunResult(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Auto-Routed" value={stats.autoRouted} icon={<GitBranch size={20} />} accent="brand" />
        <StatCard label="Pending Approvals" value={stats.pending} icon={<CheckSquare size={20} />} accent="warn" />
        <StatCard label="Notifications Sent" value={stats.sentNotifs} icon={<Mail size={20} />} accent="accent" />
        <StatCard label="Approvals Resolved" value={stats.approved + stats.rejected} icon={<CheckCircle2 size={20} />} accent="good" />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-ink-700/40 pb-px">
        {([
          { key: 'pipeline', label: 'Automation Pipeline' },
          { key: 'routing', label: 'Routing Rules' },
          { key: 'approvals', label: `Approval Queue${pendingApprovals.length ? ` (${pendingApprovals.length})` : ''}` },
          { key: 'notifications', label: 'Notification Log' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key ? 'text-brand-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-400" />}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'routing' && <RoutingTab />}
      {tab === 'approvals' && (
        <ApprovalsTab
          pending={pendingApprovals}
          resolved={resolvedApprovals}
          tickets={tickets}
          loading={loadingApprovals}
          processingId={processingApproval}
          onProcess={processApproval}
        />
      )}
      {tab === 'notifications' && (
        <NotificationsTab
          notifications={notifications}
          loading={loadingNotifications}
          onSendEmail={sendSingleEmail}
          onSendBulk={sendBulkEmails}
          sendingEmailId={sendingEmail}
          bulkSending={bulkSending}
          bulkResult={bulkResult}
          onClearBulkResult={() => setBulkResult(null)}
          emailStatus={emailStatus}
        />
      )}
      {emailModal && (
        <EmailComposeModal
          onClose={() => setEmailModal(false)}
          onSent={() => onReloadNotifications()}
        />
      )}
    </div>
  );
}

function PipelineTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <h3 className="mb-1 text-sm font-semibold text-white">Automation Pipeline</h3>
        <p className="mb-5 text-xs text-slate-500">Every ticket flows through these six stages — four are fully automated</p>
        <div className="grid gap-3 lg:grid-cols-6">
          {WORKFLOW_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[step.icon] || Inbox;
            return (
              <div key={step.id} className="relative">
                <div className={`rounded-xl border p-4 transition ${step.automated ? 'border-brand-500/30 bg-brand-500/5' : 'border-ink-700/40 bg-ink-900/40'}`}>
                  <div className="flex items-center justify-between">
                    <Icon size={20} className={step.automated ? 'text-brand-300' : 'text-slate-400'} />
                    {step.automated && (
                      <span className="rounded-md border border-brand-500/30 bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-300">AUTO</span>
                    )}
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-white">{step.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.description}</p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight size={16} className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-slate-500 lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { icon: GitBranch, title: 'Automated Ticket Routing', desc: 'Tickets are classified by AI and instantly routed to the correct department queue based on category, priority and SLA rules — no manual triage required.', color: 'text-brand-300', bg: 'border-brand-500/30 bg-brand-500/5' },
          { icon: Mail, title: 'Email Notification Triggers', desc: 'The engine fires targeted email alerts on six trigger types: auto-route, escalation, approval request, approval result, status change and SLA warning.', color: 'text-accent-300', bg: 'border-accent-500/30 bg-accent-500/5' },
          { icon: CheckSquare, title: 'Approval Workflow Integration', desc: 'High-value, critical-priority and sensitive-data tickets are automatically flagged for managerial approval before resolution can proceed.', color: 'text-warn-400', bg: 'border-warn-500/30 bg-warn-500/5' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`rounded-2xl border p-5 ${card.bg}`}>
              <Icon size={22} className={card.color} />
              <h4 className="mt-3 text-sm font-semibold text-white">{card.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoutingTab() {
  return (
    <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5 animate-fade-in">
      <h3 className="mb-1 text-sm font-semibold text-white">Department Routing Rules</h3>
      <p className="mb-5 text-xs text-slate-500">Each category maps to a department, approver and SLA target. Critical tickets auto-escalate.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700/40 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="pb-3 pr-4 font-medium">Category</th>
              <th className="pb-3 pr-4 font-medium">Department</th>
              <th className="pb-3 pr-4 font-medium">Approver</th>
              <th className="pb-3 pr-4 font-medium">SLA</th>
              <th className="pb-3 font-medium">Auto-Escalate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/30">
            {ROUTING_RULES.map((rule) => {
              return (
                <tr key={rule.id} className="transition hover:bg-ink-800/30">
                  <td className="py-3.5 pr-4">
                    <CategoryBadge category={rule.category} />
                  </td>
                  <td className="py-3.5 pr-4 text-slate-300">{rule.department}</td>
                  <td className="py-3.5 pr-4">
                    <div>
                      <p className="text-slate-200">{rule.approverRole}</p>
                      <p className="text-xs text-slate-400">{rule.approverEmail}</p>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-300">
                      <Clock size={13} className="text-slate-500" />
                      {rule.slaHours}h
                    </span>
                  </td>
                  <td className="py-3.5">
                    {rule.autoEscalate ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-danger-500/30 bg-danger-500/10 px-2 py-0.5 text-xs text-danger-400">
                        <AlertTriangle size={12} /> Enabled
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Disabled</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApprovalsTab({ pending, resolved, tickets, loading, processingId, onProcess }: {
  pending: Approval[];
  resolved: Approval[];
  tickets: Ticket[];
  loading: boolean;
  processingId: string | null;
  onProcess: (a: Approval, decision: ApprovalStatus, reason: string) => void;
}) {
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

  function getTicket(id: string): Ticket | undefined {
    return tickets.find((t) => t.id === id);
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading approvals...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Pending Approvals</h3>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700/50 py-12">
            <CheckCircle2 size={28} className="text-good-400" />
            <p className="text-sm text-slate-500">No pending approvals — all clear</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((approval) => {
              const ticket = getTicket(approval.ticket_id);
              const meta = APPROVAL_STATUS_META[approval.status];
              const isProcessing = processingId === approval.id;
              return (
                <div key={approval.id} className="rounded-2xl border border-warn-500/20 bg-ink-850/80 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {approval.status}
                        </span>
                        {ticket && <CategoryBadge category={ticket.category} />}
                        {ticket && <PriorityBadge priority={ticket.priority} />}
                      </div>
                      <p className="mt-2 text-sm font-medium text-white">{ticket?.subject || 'Unknown ticket'}</p>
                      <p className="mt-1 text-xs text-slate-500">{ticket?.body.slice(0, 120)}{ticket && ticket.body.length > 120 ? '...' : ''}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Approver: <span className="text-slate-300">{approval.approver_role}</span></span>
                        <span>·</span>
                        <span>{approval.department}</span>
                        {approval.amount != null && (
                          <>
                            <span>·</span>
                            <span className="text-good-400">Value: £{approval.amount.toLocaleString()}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{timeAgo(approval.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                      value={reasonMap[approval.id] || ''}
                      onChange={(e) => setReasonMap((prev) => ({ ...prev, [approval.id]: e.target.value }))}
                      placeholder="Add a note (optional)..."
                      className="min-w-0 flex-1 rounded-lg border border-ink-700/50 bg-ink-900 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500/50"
                    />
                    <button
                      onClick={() => onProcess(approval, 'Approved', reasonMap[approval.id] || '')}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 rounded-lg border border-good-500/40 bg-good-500/15 px-4 py-2 text-sm font-medium text-good-400 transition hover:bg-good-500/25 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => onProcess(approval, 'Rejected', reasonMap[approval.id] || '')}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 rounded-lg border border-danger-500/40 bg-danger-500/15 px-4 py-2 text-sm font-medium text-danger-400 transition hover:bg-danger-500/25 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Resolved Approvals</h3>
          <div className="space-y-2">
            {resolved.slice(0, 10).map((approval) => {
              const ticket = getTicket(approval.ticket_id);
              const meta = APPROVAL_STATUS_META[approval.status];
              return (
                <div key={approval.id} className="flex items-center gap-3 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">{ticket?.subject || 'Unknown ticket'}</p>
                    <p className="text-xs text-slate-500">
                      {approval.approver_role} · {timeAgo(approval.created_at)}
                      {approval.reason ? ` · ${approval.reason}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${meta.color}`}>{approval.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationsTabProps {
  notifications: NotificationRecord[];
  loading: boolean;
  onSendEmail: (n: NotificationRecord) => void;
  onSendBulk: () => void;
  sendingEmailId: string | null;
  bulkSending: boolean;
  bulkResult: string | null;
  onClearBulkResult: () => void;
  emailStatus: Record<string, SendEmailResult | null>;
}

function NotificationsTab({
  notifications, loading, onSendEmail, onSendBulk, sendingEmailId, bulkSending, bulkResult, onClearBulkResult, emailStatus,
}: NotificationsTabProps) {
  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700/50 py-12">
        <Mail size={28} className="text-slate-400" />
        <p className="text-sm text-slate-500">No notifications yet — run the automation engine to generate them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{notifications.length} notification{notifications.length !== 1 ? 's' : ''} in log</p>
        <button
          onClick={onSendBulk}
          disabled={bulkSending}
          className="flex items-center gap-2 rounded-lg border border-accent-500/40 bg-accent-500/15 px-4 py-2 text-sm font-medium text-accent-300 transition hover:bg-accent-500/25 disabled:opacity-50"
        >
          {bulkSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {bulkSending ? 'Sending...' : 'Send All Emails'}
        </button>
      </div>

      {bulkResult && (
        <div className="flex items-start gap-2 rounded-lg border border-accent-500/30 bg-accent-500/10 p-3 text-sm text-accent-300">
          <Mail size={16} className="mt-0.5 shrink-0" />
          <span>{bulkResult}</span>
          <button onClick={onClearBulkResult} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const channel = CHANNEL_META[n.channel] || CHANNEL_META.Email;
          const status = NOTIF_STATUS_META[n.status] || NOTIF_STATUS_META.Queued;
          const ChannelIcon = channel.icon;
          const isSending = sendingEmailId === n.id;
          const statusResult = emailStatus[n.id];
          return (
            <div key={n.id} className="flex items-start gap-3 rounded-lg border border-ink-700/30 bg-ink-850/80 p-4">
              <div className={'rounded-lg border p-2 ' + channel.bg}>
                <ChannelIcon size={16} className={channel.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-200">{n.subject}</p>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-400">{n.recipient}</span>
                  <span>·</span>
                  <span className="rounded border border-ink-700/40 px-1.5 py-0.5 text-[10px] text-slate-400">{n.trigger.split('_').join(' ')}</span>
                  <span>·</span>
                  <span>{timeAgo(n.created_at)}</span>
                </div>
                {statusResult && !statusResult.success && statusResult.needsApiKey && (
                  <p className="mt-1.5 text-xs text-warn-400">API key needed — see note below</p>
                )}
                {statusResult && statusResult.success && (
                  <p className="mt-1.5 text-xs text-good-400">Email delivered</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={'h-2 w-2 rounded-full ' + status.dot} />
                  <span className={'text-xs font-medium ' + status.color}>{n.status}</span>
                </div>
                <button
                  onClick={() => onSendEmail(n)}
                  disabled={isSending}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-700/50 bg-ink-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-accent-500/40 hover:text-accent-300 disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {isSending ? 'Sending' : 'Send'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmailComposeModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendEmailResult | null>(null);

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    const res = await sendEmail({ to: to.trim(), subject: subject.trim(), text: body.trim() });
    setResult(res);
    setSending(false);
    if (res.success) {
      await supabase.from('notification_log').insert({
        channel: 'Email',
        recipient: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        status: 'Delivered',
        trigger: 'MANUAL_COMPOSE',
      });
      onSent();
      setTimeout(onClose, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-ink-700/50 bg-ink-900 shadow-card animate-slide-up">
        <div className="flex items-center justify-between border-b border-ink-700/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <PenSquare size={18} className="text-brand-300" />
            <h3 className="text-base font-semibold text-white">Compose Email</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">To</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full rounded-lg border border-ink-700/50 bg-ink-850 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full rounded-lg border border-ink-700/50 bg-ink-850 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={6}
              className="w-full resize-none rounded-lg border border-ink-700/50 bg-ink-850 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500/50"
            />
          </div>

          {result && (
            <div className={'flex items-start gap-2 rounded-lg border p-3 text-sm ' + (result.success ? 'border-good-500/30 bg-good-500/10 text-good-400' : 'border-warn-500/30 bg-warn-500/10 text-warn-400')}>
              {result.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-ink-700/50 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
