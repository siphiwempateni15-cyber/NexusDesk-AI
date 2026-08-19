import { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, ScrollText, FileWarning, Eye, Lock, Scale } from 'lucide-react';
import type { Ticket, AuditLog } from '../types';
import { StatCard } from '../components/StatCard';
import { CategoryBadge } from '../components/Badges';
import { timeAgo } from '../lib/ui';

interface ComplianceProps {
  tickets: Ticket[];
  logs: AuditLog[];
  loading: boolean;
}

const RISK_FLAG_META: Record<string, { label: string; icon: typeof Lock; severity: 'high' | 'medium' | 'low' }> = {
  personal_data: { label: 'Personal Data', icon: Lock, severity: 'high' },
  financial_data: { label: 'Financial Data', icon: Lock, severity: 'medium' },
  regulatory: { label: 'Regulatory', icon: Scale, severity: 'high' },
  high_value_transaction: { label: 'High Value Transaction', icon: FileWarning, severity: 'medium' },
  potential_bias_language: { label: 'Potential Bias Language', icon: Eye, severity: 'high' },
};

const ACTION_META: Record<string, { color: string; bg: string }> = {
  CLASSIFIED: { color: 'text-brand-300', bg: 'bg-brand-500/10' },
  RESPONDED: { color: 'text-accent-300', bg: 'bg-accent-500/10' },
  RISK_CHECKED: { color: 'text-warn-400', bg: 'bg-warn-500/10' },
  STATUS_CHANGED: { color: 'text-slate-300', bg: 'bg-ink-700/40' },
};

export function Compliance({ tickets, logs, loading }: ComplianceProps) {
  const stats = useMemo(() => {
    const flagged = tickets.filter((t) => t.risk_flags.length > 0);
    const highRisk = tickets.filter((t) => t.risk_score > 40);
    const avgRisk = tickets.length ? Math.round(tickets.reduce((s, t) => s + t.risk_score, 0) / tickets.length) : 0;

    const flagCounts: Record<string, number> = {};
    flagged.forEach((t) => t.risk_flags.forEach((f) => { flagCounts[f] = (flagCounts[f] || 0) + 1; }));

    const flaggedTickets = [...flagged].sort((a, b) => b.risk_score - a.risk_score);

    return { flagged: flagged.length, highRisk: highRisk.length, avgRisk, flagCounts, flaggedTickets };
  }, [tickets]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-ink-700/40 bg-gradient-to-br from-ink-850 to-ink-900 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-warn-500/30 bg-warn-500/10 p-2.5">
            <ShieldCheck size={22} className="text-warn-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Compliance & Risk Monitoring</h2>
            <p className="mt-0.5 text-sm text-slate-400">Ethical AI governance, bias detection and transparency logging</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Flagged Tickets" value={stats.flagged} icon={<AlertTriangle size={20} />} accent="warn" />
        <StatCard label="High Risk" value={stats.highRisk} icon={<FileWarning size={20} />} accent="danger" />
        <StatCard label="Avg Risk Score" value={`${stats.avgRisk}/100`} icon={<Scale size={20} />} accent="accent" />
        <StatCard label="Audit Events" value={logs.length} icon={<ScrollText size={20} />} accent="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Risk Flag Distribution</h3>
          {Object.keys(stats.flagCounts).length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No risk flags detected</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.flagCounts).sort((a, b) => b[1] - a[1]).map(([flag, count]) => {
                const meta = RISK_FLAG_META[flag] || { label: flag, icon: AlertTriangle, severity: 'low' as const };
                const Icon = meta.icon;
                const sevColor = meta.severity === 'high' ? 'text-danger-400' : meta.severity === 'medium' ? 'text-warn-400' : 'text-slate-400';
                return (
                  <div key={flag} className="flex items-center gap-3 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3">
                    <Icon size={18} className={sevColor} />
                    <span className="flex-1 text-sm text-slate-300">{meta.label}</span>
                    <span className="rounded-md border border-ink-700/40 px-2 py-0.5 text-xs font-semibold text-slate-300">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Governance Framework</h3>
          <div className="space-y-3">
            {[
              { icon: Lock, title: 'Data Protection', desc: 'Automated detection of personal and financial data in requests before response generation.' },
              { icon: Eye, title: 'Bias Monitoring', desc: 'Language analysis flags protected characteristics to ensure inclusive responses.' },
              { icon: Scale, title: 'Regulatory Compliance', desc: 'GDPR and regulatory references trigger mandatory human review workflow.' },
              { icon: ScrollText, title: 'Audit Transparency', desc: 'Every AI action — classification, response, risk check — is logged immutably.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3">
                  <Icon size={18} className="mt-0.5 text-brand-300" />
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">High-Risk Tickets Requiring Review</h3>
        {stats.flaggedTickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No flagged tickets</p>
        ) : (
          <div className="space-y-2">
            {stats.flaggedTickets.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{t.subject}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <CategoryBadge category={t.category} />
                    <span className="text-xs text-slate-500">{timeAgo(t.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {t.risk_flags.map((f) => {
                    const meta = RISK_FLAG_META[f] || { label: f, severity: 'low' as const };
                    return (
                      <span key={f} className={`rounded-md border px-2 py-0.5 text-xs ${
                        meta.severity === 'high' ? 'border-danger-500/30 bg-danger-500/10 text-danger-400' :
                        meta.severity === 'medium' ? 'border-warn-500/30 bg-warn-500/10 text-warn-400' :
                        'border-slate-500/30 bg-slate-500/10 text-slate-400'
                      }`}>
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
                <div className="w-16 text-right">
                  <span className={`text-sm font-bold ${t.risk_score > 40 ? 'text-danger-400' : 'text-warn-400'}`}>
                    {t.risk_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <ScrollText size={16} className="text-brand-300" />
          Audit Log — Transparency Trail
        </h3>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading audit trail...</p>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No audit events yet. Create a ticket from the Intake page to generate logs.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {logs.map((log) => {
              const meta = ACTION_META[log.action] || { color: 'text-slate-300', bg: 'bg-ink-700/40' };
              return (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border border-ink-700/20 bg-ink-900/30 p-3">
                  <span className={`mt-0.5 rounded-md px-2 py-0.5 text-xs font-semibold ${meta.bg} ${meta.color}`}>
                    {log.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-300">{log.detail}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      <span className="text-slate-500">{log.actor}</span> · {timeAgo(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
