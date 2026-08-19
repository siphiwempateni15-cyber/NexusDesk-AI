import { useState } from 'react';
import { Search, Inbox, Zap, ShieldCheck, X, Clock, Tag } from 'lucide-react';
import type { Ticket, TicketStatus, Category } from '../types';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/Badges';
import { timeAgo, pct, TONE_META, CATEGORY_META } from '../lib/ui';
import { supabase } from '../lib/supabase';
import { sendTicketStatusEmail } from '../lib/email';

interface TicketsProps {
  tickets: Ticket[];
  loading: boolean;
  onReload: () => void;
}

const STATUS_FILTERS: (TicketStatus | 'All')[] = ['All', 'Open', 'In Progress', 'Resolved', 'Escalated'];

export function Tickets({ tickets, loading, onReload }: TicketsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');
  const [catFilter, setCatFilter] = useState<Category | 'All'>('All');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (catFilter !== 'All' && t.category !== catFilter) return false;
    if (search && !`${t.subject} ${t.body}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function updateStatus(ticket: Ticket, status: TicketStatus) {
    setUpdating(true);
    const { error } = await supabase.from('tickets').update({ status }).eq('id', ticket.id);
    if (!error) {
      await supabase.from('audit_logs').insert({
        ticket_id: ticket.id,
        action: 'STATUS_CHANGED',
        actor: 'Service Desk Analyst',
        detail: `Status changed from ${ticket.status} to ${status}`,
        metadata: { from: ticket.status, to: status },
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', ticket.user_id)
        .maybeSingle();

      if (profile?.email) {
        await sendTicketStatusEmail({
          ticketId: ticket.id.slice(0, 8).toUpperCase(),
          ticketDbId: ticket.id,
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          department: ticket.department || '',
          status,
          aiResponse: ticket.ai_response || '',
          recipient: profile.email,
          previousStatus: ticket.status,
        });
      }

      onReload();
    }
    setUpdating(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Ticket Queue</h2>
          <p className="mt-0.5 text-sm text-slate-400">{filtered.length} of {tickets.length} tickets shown</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-700/40 bg-ink-850/80 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-ink-700/50 bg-ink-900 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500/50"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as Category | 'All')}
          className="rounded-lg border border-ink-700/50 bg-ink-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-brand-500/50"
        >
          <option value="All">All Categories</option>
          <option value="IT">IT</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
        </select>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                statusFilter === s ? 'bg-brand-500/15 text-brand-300' : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700/50 py-20">
          <Inbox size={32} className="text-slate-400" />
          <p className="text-sm text-slate-500">No tickets match your filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-700/40 bg-ink-850/80">
          <div className="divide-y divide-ink-700/30">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-ink-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">{t.subject}</p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{t.body}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={12} /> {timeAgo(t.created_at)}
                    <span>·</span>
                    <span>{t.department}</span>
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <CategoryBadge category={t.category} />
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <TicketDetail
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={(s) => updateStatus(selected, s)}
          updating={updating}
        />
      )}
    </div>
  );
}

function TicketDetail({ ticket, onClose, onUpdateStatus, updating }: {
  ticket: Ticket;
  onClose: () => void;
  onUpdateStatus: (s: TicketStatus) => void;
  updating: boolean;
}) {
  const m = CATEGORY_META[ticket.category];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-700/50 bg-ink-900 shadow-card animate-slide-up">
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-700/50 bg-ink-900/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Tag size={16} className={m.color} />
            <h3 className="text-base font-semibold text-white">{ticket.subject}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={ticket.category} />
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <span className="rounded-md border border-ink-700/40 px-2 py-1 text-xs text-slate-400">
              Confidence {pct(ticket.confidence)}
            </span>
            <span className={`rounded-md border border-ink-700/40 px-2 py-1 text-xs ${TONE_META[ticket.tone].color}`}>
              {TONE_META[ticket.tone].label} tone
            </span>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Request</p>
            <p className="rounded-lg border border-ink-700/30 bg-ink-850 p-4 text-sm leading-relaxed text-slate-300">{ticket.body}</p>
          </div>

          {ticket.matched_keywords.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Matched Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {ticket.matched_keywords.map((k) => (
                  <span key={k} className="rounded-md border border-ink-700/40 bg-ink-850 px-2 py-0.5 text-xs text-slate-300">{k}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Zap size={14} className="text-accent-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">AI Generated Response</p>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-accent-500/20 bg-accent-500/5 p-4 text-sm leading-relaxed text-slate-300 font-sans">
              {ticket.ai_response || 'No response generated yet.'}
            </pre>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-ink-700/40 bg-ink-850 p-3">
              <p className="text-xs text-slate-500">Response Time</p>
              <p className="mt-1 text-sm font-semibold text-white">{(ticket.response_time_ms / 1000).toFixed(1)}s</p>
            </div>
            <div className="rounded-lg border border-ink-700/40 bg-ink-850 p-3">
              <p className="text-xs text-slate-500">Risk Score</p>
              <p className={`mt-1 text-sm font-semibold ${ticket.risk_score > 40 ? 'text-danger-400' : ticket.risk_score > 20 ? 'text-warn-400' : 'text-good-400'}`}>
                {ticket.risk_score}/100
              </p>
            </div>
            <div className="rounded-lg border border-ink-700/40 bg-ink-850 p-3">
              <p className="text-xs text-slate-500">Department</p>
              <p className="mt-1 text-sm font-semibold text-white">{ticket.department}</p>
            </div>
          </div>

          {ticket.risk_flags.length > 0 && (
            <div className="rounded-lg border border-warn-500/20 bg-warn-500/5 p-4">
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

          {ticket.bias_flags.length > 0 ? (
            <div className="rounded-lg border border-warn-500/20 bg-warn-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-warn-400" />
                <p className="text-xs font-medium text-warn-400">Bias Flags</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ticket.bias_flags.map((f) => (
                  <span key={f} className="rounded-md border border-warn-500/20 bg-warn-500/10 px-2 py-0.5 text-xs text-warn-400">
                    {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-good-500/20 bg-good-500/5 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-good-400" />
                <p className="text-xs font-medium text-good-400">Bias Check Passed — no biased language detected</p>
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {(['Open', 'In Progress', 'Resolved', 'Escalated'] as TicketStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={updating || ticket.status === s}
                  onClick={() => onUpdateStatus(s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-30 ${
                    ticket.status === s ? 'border-brand-500/50 bg-brand-500/15 text-brand-300' : 'border-ink-700/50 text-slate-400 hover:bg-ink-800 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
