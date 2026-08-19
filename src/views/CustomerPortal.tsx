import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, Tag, Zap, ShieldCheck, Inbox, Clock, Search, CheckCircle2, ArrowRight, MessageSquare, ListChecks, Bell, AlertCircle, RotateCcw } from 'lucide-react';
import type { Category, Priority, Ticket, ClassificationResult, AuditLog, NotificationRecord } from '../types';
import { classify } from '../lib/classifier';
import { generateResponse } from '../lib/responder';
import { evaluateRisk } from '../lib/risk';
import { supabase } from '../lib/supabase';
import { sendTicketCreatedEmail } from '../lib/email';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/Badges';
import { pct, timeAgo } from '../lib/ui';
import { useAuth } from '../context/AuthContext';

type CustomerView = 'new' | 'mine';

function deriveSubject(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 60) return trimmed;
  const cut = trimmed.slice(0, 60);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 30 ? lastSpace : 60).trim}...`;
}

export function CustomerPortal() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<CustomerView>('new');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [search, setSearch] = useState('');

  async function loadMyTickets() {
    setLoadingTickets(true);
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets((data || []) as Ticket[]);
    setLoadingTickets(false);
  }

  function switchToMine() {
    setView('mine');
    loadMyTickets();
  }

  const filtered = tickets.filter((t) =>
    !search || `${t.subject} ${t.body}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-700/50 bg-ink-950/80 px-4 py-3 backdrop-blur lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 p-2 shadow-glow">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">NexusDesk AI</h1>
            <p className="text-xs text-slate-500">Customer Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-850 px-3 py-1.5 sm:flex">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-xs font-bold text-white">
              {(user?.email ?? 'U')[0].toUpperCase()}
            </div>
            <span className="text-xs text-slate-400">{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg border border-ink-700/50 bg-ink-850 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-danger-500/30 hover:text-danger-400"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Hero stats */}
      <div className="mx-auto max-w-4xl px-4 pt-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-ink-700/60 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-6 shadow-card">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Welcome back</h2>
              <p className="mt-0.5 text-sm text-slate-400">Track your support requests in real time</p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-center">
                <p className="text-xl font-bold text-accent-300">{openCount}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
              <div className="rounded-xl border border-good-500/30 bg-good-500/10 px-4 py-2 text-center">
                <p className="text-xl font-bold text-good-400">{resolvedCount}</p>
                <p className="text-xs text-slate-500">Resolved</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="mx-auto max-w-4xl px-4 pt-6 lg:px-8">
        <div className="flex gap-2 rounded-xl border border-ink-700/40 bg-ink-850/80 p-1">
          <button
            onClick={() => setView('new')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              view === 'new' ? 'bg-brand-500/15 text-brand-300 shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={16} /> Submit New Ticket
          </button>
          <button
            onClick={switchToMine}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              view === 'mine' ? 'bg-brand-500/15 text-brand-300 shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListChecks size={16} /> My Tickets
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
        {view === 'new' && <SubmitTicket onSubmitted={switchToMine} />}
        {view === 'mine' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Tickets</h2>
              <button
                onClick={loadMyTickets}
                className="flex items-center gap-1.5 rounded-lg border border-ink-700/50 bg-ink-850 px-3 py-1.5 text-xs text-slate-300 transition hover:border-brand-500/30 hover:text-brand-300"
              >
                <Sparkles size={12} /> Refresh
              </button>
            </div>

            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-brand-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your tickets..."
                className="w-full rounded-lg border border-ink-700/50 bg-ink-900 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {loadingTickets ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl border border-ink-700/40 bg-ink-850/80 shimmer" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700/50 py-20">
                <div className="rounded-2xl bg-ink-850 p-4">
                  <Inbox size={32} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">You haven't submitted any tickets yet</p>
                <button
                  onClick={() => setView('new')}
                  className="mt-2 flex items-center gap-2 rounded-lg border border-brand-500/40 bg-brand-500/15 px-4 py-2 text-sm font-medium text-brand-300 transition hover-lift hover:bg-brand-500/25"
                >
                  Submit your first ticket <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-ink-700/40 bg-ink-850/80">
                <div className="divide-y divide-ink-700/30">
                  {filtered.map((t, i) => (
                    <div key={t.id} style={{ animation: `staggerIn 0.4s ease-out ${i * 0.05}s both` }}>
                      <CustomerTicketRow ticket={t} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function CustomerTicketRow({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || logs.length > 0) return;
    setLoading(true);
    Promise.all([
      supabase.from('audit_logs').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true }),
      supabase.from('notification_log').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true }),
    ]).then(([logRes, notifRes]) => {
      setLogs((logRes.data as AuditLog[]) ?? []);
      setNotifications((notifRes.data as NotificationRecord[]) ?? []);
      setLoading(false);
    });
  }, [open, ticket.id, logs.length]);

  const statusOrder: Record<string, number> = { Open: 0, 'In Progress': 1, Escalated: 2, Resolved: 3 };
  const statusStep = statusOrder[ticket.status] ?? 0;
  const steps = ['Open', 'In Progress', 'Escalated', 'Resolved'];

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-ink-800/50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{ticket.subject}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{ticket.body}</p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} /> {timeAgo(ticket.created_at)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CategoryBadge category={ticket.category as Category} />
          <StatusBadge status={ticket.status} />
        </div>
      </button>
      {open && (
        <div className="border-t border-ink-700/30 bg-ink-900/40 p-5 animate-slide-up">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CategoryBadge category={ticket.category as Category} />
            <PriorityBadge priority={ticket.priority as Priority} />
            <StatusBadge status={ticket.status} />
            <span className="rounded-md border border-ink-700/40 px-2 py-1 text-xs text-slate-400">
              Confidence {pct(ticket.confidence)}
            </span>
          </div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Your Request</p>
          <p className="mb-4 rounded-lg border border-ink-700/30 bg-ink-850 p-4 text-sm leading-relaxed text-slate-300">{ticket.body}</p>
          <div className="mb-1.5 flex items-center gap-2">
            <Zap size={14} className="text-accent-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">AI Response</p>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-accent-500/20 bg-accent-500/5 p-4 text-sm leading-relaxed text-slate-300 font-sans">
            {ticket.ai_response || 'No response generated yet.'}
          </pre>

          {/* Progress timeline */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <ListChecks size={14} className="text-brand-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Progress Timeline</p>
            </div>
            <div className="flex items-center gap-1">
              {steps.map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${
                        i <= statusStep
                          ? s === 'Resolved'
                            ? 'border-good-500 bg-good-500/20 text-good-400'
                            : s === 'Escalated'
                            ? 'border-danger-500 bg-danger-500/20 text-danger-400'
                            : 'border-brand-500 bg-brand-500/20 text-brand-300'
                          : 'border-ink-700 bg-ink-900 text-slate-600'
                      }`}
                    >
                      {i < statusStep ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <span className={`text-[10px] ${i <= statusStep ? 'text-slate-300' : 'text-slate-600'}`}>{s}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded-full ${i < statusStep ? 'bg-brand-500/40' : 'bg-ink-700/40'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Activity Log</p>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                <Loader2 size={12} className="animate-spin" /> Loading activity...
              </div>
            ) : logs.length === 0 ? (
              <p className="py-2 text-xs text-slate-600">No activity recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-300">
                        <span className="font-medium text-slate-200">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-slate-500"> · {log.actor}</span>
                      </p>
                      {log.detail && <p className="mt-0.5 text-xs text-slate-500">{log.detail}</p>}
                      <p className="mt-0.5 text-[10px] text-slate-600">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email notifications */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Bell size={14} className="text-slate-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Email Notifications Sent</p>
            </div>
            {notifications.length === 0 ? (
              <p className="py-2 text-xs text-slate-600">No email notifications sent yet.</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 rounded-lg border border-ink-700/30 bg-ink-850/60 p-3">
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.status === 'Sent' ? 'bg-good-500' : n.status === 'Failed' ? 'bg-danger-500' : 'bg-warn-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-200">{n.subject}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {n.channel} · {n.status} · {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {ticket.risk_flags.length > 0 && (
            <div className="mt-4 rounded-lg border border-warn-500/20 bg-warn-500/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-warn-400" />
                <p className="text-xs font-medium text-warn-400">Compliance Flags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ticket.risk_flags.map((f) => (
                  <span key={f} className="rounded-md border border-warn-500/20 bg-warn-500/10 px-2 py-0.5 text-xs text-warn-400">
                    {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubmitTicket({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ classification: ClassificationResult; response: string; riskScore: number; riskFlags: string[]; ticketRef: string; subject: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user!.id).maybeSingle();
      setCustomerName((data?.full_name as string | undefined)?.trim() ?? '');
    })();
  }, [user]);

  async function submitTicket() {
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    setSaved(false);
    setResult(null);

    const name = customerName.trim();

    const subject = deriveSubject(body);
    const classification = classify(subject, body);

    if (!classification.relevant) {
      setResult({ classification, response: '', riskScore: 0, riskFlags: [], ticketRef: '', subject });
      setSaved(true);
      setSubmitting(false);
      return;
    }

    const ticketRef = `ND-${Math.floor(1000 + Math.random() * 9000)}`;
    const response = generateResponse({ category: classification.category, priority: classification.priority, subject, ticketRef, customerName: name, biasDetected: classification.biasCheck.detected });
    const risk = evaluateRisk({ body, category: classification.category, priority: classification.priority });
    setResult({ classification, response, riskScore: risk.riskScore, riskFlags: risk.riskFlags, ticketRef, subject });

    const status: Ticket['status'] = classification.priority === 'Critical' ? 'Escalated' : 'Open';
    const row = {
      subject,
      body: body.trim(),
      category: classification.category,
      priority: classification.priority,
      confidence: classification.confidence,
      matched_keywords: classification.matchedKeywords,
      tone: 'formal',
      ai_response: response,
      status,
      risk_flags: risk.riskFlags,
      risk_score: risk.riskScore,
      response_time_ms: Math.floor(800 + Math.random() * 600),
      department: classification.department,
      bias_flags: classification.biasCheck.flags,
    };

    const { data, error: insertError } = await supabase.from('tickets').insert(row).select('id').single();
    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    if (data) {
      await supabase.from('audit_logs').insert([
        { ticket_id: data.id, action: 'CLASSIFIED', actor: 'AI Classifier', detail: `Routed to ${classification.category} (${classification.department}) with ${pct(classification.confidence)} confidence`, metadata: { confidence: classification.confidence, keywords: classification.matchedKeywords } },
        { ticket_id: data.id, action: 'RESPONDED', actor: 'AI Response Generator', detail: `Generated formal response for ${classification.priority} priority ticket`, metadata: { tone: 'formal', priority: classification.priority } },
        { ticket_id: data.id, action: 'RISK_CHECKED', actor: 'Compliance Engine', detail: `Risk score ${risk.riskScore}/100 — ${risk.riskFlags.length} flags`, metadata: { riskScore: risk.riskScore, flags: risk.riskFlags } },
        { ticket_id: data.id, action: 'BIAS_CHECKED', actor: 'AI Bias Detector', detail: classification.biasCheck.detected ? `Bias flagged: ${classification.biasCheck.flags.join(', ')}` : 'No biased language detected', metadata: { detected: classification.biasCheck.detected, flags: classification.biasCheck.flags } },
      ]);

      if (user?.email) {
        const emailResult = await sendTicketCreatedEmail({
          ticketId: ticketRef,
          ticketDbId: data.id,
          subject,
          category: classification.category,
          priority: classification.priority,
          department: classification.department,
          status: 'Open',
          aiResponse: response,
          recipient: user.email,
          customerName: name,
        });
        setEmailStatus({ sent: emailResult.success, message: emailResult.message });
      }
    }
    setSaved(true);
    setSubmitting(false);
  }

  function reset() {
    setBody(''); setResult(null); setSaved(false); setError(null); setEmailStatus(null);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-card ${saved ? (result?.ticketRef ? 'border-good-500/30 bg-gradient-to-br from-good-500/10 via-ink-850 to-ink-950' : 'border-warn-500/30 bg-gradient-to-br from-warn-500/10 via-ink-850 to-ink-950') : 'border-ink-700/60 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950'}`}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className={`rounded-xl border p-2.5 ${saved ? (result?.ticketRef ? 'border-good-500/30 bg-good-500/10' : 'border-warn-500/30 bg-warn-500/10') : 'border-brand-500/30 bg-brand-500/10'}`}>
            {saved ? (result?.ticketRef ? <CheckCircle2 size={22} className="text-good-300" /> : <AlertCircle size={22} className="text-warn-400" />) : <Sparkles size={22} className="text-brand-300" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{saved ? (result?.ticketRef ? 'Ticket Submitted' : 'Ticket Rejected') : 'Submit a Ticket'}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{saved ? (result?.ticketRef ? `Your request has been logged under reference ${result.ticketRef}` : 'Your submission was not recognised as a support request and has not been saved') : 'Tell us what\'s wrong — we\'ll classify, route, and respond automatically'}</p>
          </div>
        </div>
      </div>

      {!saved && (
        <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Describe your problem</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell us what's going on. The more detail you give, the faster we can help..."
            rows={8}
            className="w-full resize-none rounded-lg border border-ink-700/50 bg-ink-900 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
          />

          <button
            onClick={submitTicket}
            disabled={!body.trim() || submitting}
            className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 hover:shadow-glow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="transition-transform group-hover:scale-110" />}
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
          {error && <p className="mt-3 text-xs text-danger-400">{error}</p>}
        </div>
      )}

      {submitting && (
        <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-8 shadow-card animate-slide-up">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 size={32} className="animate-spin text-brand-400" />
              <div className="absolute inset-0 animate-glow-pulse rounded-full" />
            </div>
            <p className="text-sm text-slate-400">Classifying and routing your request...</p>
            <div className="flex gap-1.5">
              <Tag size={14} className="text-slate-400 animate-pulse-soft" />
              <Zap size={14} className="text-slate-400 animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
              <ShieldCheck size={14} className="text-slate-400 animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {!submitting && result && (
        <div className="space-y-4 animate-slide-up">
          {!result.ticketRef ? (
            <div className="rounded-2xl border border-warn-500/30 bg-warn-500/5 p-6 shadow-card text-center">
              <div className="mx-auto mb-4 w-fit rounded-xl border border-warn-500/30 bg-warn-500/10 p-3">
                <AlertCircle size={28} className="text-warn-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">This submission was not recognised as a support request</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Our system could not identify a problem or request in your message. Tickets must relate to a real IT, HR, Finance, or Operations issue. Your submission was not saved and no ticket was created.
              </p>
              <div className="mt-4 rounded-lg border border-ink-700/40 bg-ink-900/60 p-3 text-left">
                <p className="text-xs text-slate-500">What you submitted</p>
                <p className="mt-1 text-sm text-slate-300">{result.subject}</p>
              </div>
              <button onClick={reset} className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                <RotateCcw size={16} /> Try again
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Classification Result</h3>
                  <span className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-300">
                    {pct(result.classification.confidence)} confidence
                  </span>
                </div>
                <div className="mb-3 rounded-lg border border-brand-500/30 bg-brand-500/5 px-3 py-2">
                  <p className="text-xs text-slate-500">Ticket Reference</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-300">{result.ticketRef}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-ink-700/40 bg-ink-900/60 p-3">
                    <p className="text-xs text-slate-500">Category</p>
                    <div className="mt-1.5"><CategoryBadge category={result.classification.category as Category} /></div>
                  </div>
                  <div className="rounded-lg border border-ink-700/40 bg-ink-900/60 p-3">
                    <p className="text-xs text-slate-500">Priority</p>
                    <div className="mt-1.5"><PriorityBadge priority={result.classification.priority as Priority} /></div>
                  </div>
                  <div className="col-span-2 rounded-lg border border-ink-700/40 bg-ink-900/60 p-3">
                    <p className="text-xs text-slate-500">Routed Department</p>
                    <p className="mt-1 text-sm font-medium text-white">{result.classification.department}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-ink-700/40 bg-ink-900/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Compliance Risk</p>
                    <span className={`text-xs font-semibold ${result.riskScore > 40 ? 'text-danger-400' : result.riskScore > 20 ? 'text-warn-400' : 'text-good-400'}`}>
                      {result.riskScore}/100
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${result.riskScore > 40 ? 'bg-danger-500' : result.riskScore > 20 ? 'bg-warn-500' : 'bg-good-500'}`}
                      style={{ width: `${result.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 shadow-card ${result.classification.biasCheck.detected ? 'border-warn-500/30 bg-warn-500/5' : 'border-good-500/20 bg-good-500/5'}`}>
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className={result.classification.biasCheck.detected ? 'text-warn-400' : 'text-good-400'} />
                  <h3 className="text-sm font-semibold text-white">Bias & Fairness Check</h3>
                  <span className={`ml-auto rounded-lg border px-2.5 py-1 text-xs font-medium ${result.classification.biasCheck.detected ? 'border-warn-500/30 bg-warn-500/10 text-warn-400' : 'border-good-500/30 bg-good-500/10 text-good-400'}`}>
                    {result.classification.biasCheck.detected ? 'Flagged' : 'Clear'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{result.classification.biasCheck.note}</p>
                {result.classification.biasCheck.flags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.classification.biasCheck.flags.map((f) => (
                      <span key={f} className="rounded-md border border-warn-500/20 bg-warn-500/10 px-2 py-0.5 text-xs text-warn-400">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card">
                <div className="mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-accent-400" />
                  <h3 className="text-sm font-semibold text-white">Generated AI Response</h3>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-ink-700/30 bg-ink-900/60 p-4 text-sm leading-relaxed text-slate-300 font-sans">{result.response}</pre>
              </div>
            </>
          )}

          {saved && result.ticketRef && (
            <div className="space-y-3 animate-slide-up">
              {emailStatus && (
                <div className={`flex items-start gap-2 rounded-lg border px-4 py-2.5 text-xs ${emailStatus.sent ? 'border-good-500/20 bg-good-500/5 text-good-400' : 'border-warn-500/20 bg-warn-500/5 text-warn-400'}`}>
                  {emailStatus.sent ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                  <span>{emailStatus.message}</span>
                </div>
              )}
              <button onClick={onSubmitted} className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/15 px-4 py-3 text-sm font-semibold text-brand-300 transition hover-lift hover:bg-brand-500/25">
                View my tickets <ArrowRight size={16} />
              </button>
              <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-700/50 bg-ink-850 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-ink-800 hover:text-slate-200">
                Submit another ticket
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
