import { Inbox, CheckCircle2, AlertTriangle, Clock, Cpu, Users, PoundSterling, Building2, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import type { Ticket, ViewKey } from '../types';
import { StatCard } from '../components/StatCard';
import { BarChart, DonutChart } from '../components/Charts';
import { CategoryBadge, StatusBadge } from '../components/Badges';
import { timeAgo, CATEGORY_META } from '../lib/ui';
import type { Category } from '../types';

interface DashboardProps {
  tickets: Ticket[];
  onNavigate: (v: ViewKey) => void;
}

export function Dashboard({ tickets, onNavigate }: DashboardProps) {
  const open = tickets.filter((t) => t.status === 'Open').length;
  const resolved = tickets.filter((t) => t.status === 'Resolved').length;
  const escalated = tickets.filter((t) => t.status === 'Escalated').length;
  const avgResponse = tickets.length ? Math.round(tickets.reduce((s, t) => s + t.response_time_ms, 0) / tickets.length) : 0;

  const catCounts: Record<Category, number> = { IT: 0, HR: 0, Finance: 0, Operations: 0 };
  tickets.forEach((t) => { catCounts[t.category]++; });

  const last7 = new Array(7).fill(0);
  const today = new Date();
  tickets.forEach((t) => {
    const diff = Math.floor((today.getTime() - new Date(t.created_at).getTime()) / 86400000);
    if (diff >= 0 && diff < 7) last7[6 - diff]++;
  });

  const donutSegments = (['IT', 'HR', 'Finance', 'Operations'] as Category[]).map((c) => ({
    label: c,
    value: catCounts[c],
    color: { IT: '#60a5fa', HR: '#38bdf8', Finance: '#4ade80', Operations: '#fbbf24' }[c],
  }));

  const barData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({
    label, value: last7[i],
  }));

  const recent = tickets.slice(0, 5);
  const resolveRate = Math.round((resolved / (tickets.length || 1)) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-700/60 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-6 shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-400" />
              Live Operations
            </div>
            <h2 className="text-2xl font-bold text-white">Service Desk Overview</h2>
            <p className="mt-1 text-sm text-slate-400">Real-time intelligence across all support operations</p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl border border-ink-700/50 bg-ink-900/60 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-white">{tickets.length}</p>
              <p className="text-xs text-slate-500">Total Tickets</p>
            </div>
            <div className="rounded-xl border border-good-500/30 bg-good-500/10 px-4 py-2 text-center">
              <p className="text-2xl font-bold text-good-400">{resolveRate}%</p>
              <p className="text-xs text-slate-500">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Tickets" value={open} icon={<Inbox size={20} />} accent="accent" trend={{ value: 'Awaiting triage', direction: 'flat' }} />
        <StatCard label="Resolved" value={resolved} icon={<CheckCircle2 size={20} />} accent="good" trend={{ value: 'This week', direction: 'up' }} />
        <StatCard label="Escalated" value={escalated} icon={<AlertTriangle size={20} />} accent="danger" trend={{ value: 'Needs attention', direction: 'up' }} />
        <StatCard label="Avg Response" value={`${(avgResponse / 1000).toFixed(1)}s`} icon={<Clock size={20} />} accent="brand" trend={{ value: 'SLA met', direction: 'flat' }} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" />
              <h3 className="text-sm font-semibold text-white">Tickets — Last 7 Days</h3>
            </div>
            <span className="rounded-lg border border-ink-700/50 bg-ink-900/60 px-2.5 py-1 text-xs text-slate-400">
              {last7.reduce((a, b) => a + b, 0)} this week
            </span>
          </div>
          <BarChart data={barData} height={200} />
        </div>
        <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-white">By Category</h3>
          <DonutChart segments={donutSegments} size={160} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Category Distribution</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['IT', 'HR', 'Finance', 'Operations'] as Category[]).map((c) => {
              const m = CATEGORY_META[c];
              const count = catCounts[c];
              const icons = { IT: Cpu, HR: Users, Finance: PoundSterling, Operations: Building2 };
              const Icon = icons[c];
              return (
                <div key={c} className={`group rounded-xl border p-4 transition-all duration-300 hover-lift ${m.bg}`}>
                  <div className="flex items-center justify-between">
                    <Icon size={20} className={m.color} />
                    <span className="text-2xl font-bold text-white">{count}</span>
                  </div>
                  <p className={`mt-2 text-sm font-medium ${m.color}`}>{m.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-400" />
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>
            <button onClick={() => onNavigate('tickets')} className="flex items-center gap-1 text-xs text-brand-300 transition hover:text-brand-200">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No recent activity</p>
            ) : recent.map((t, i) => (
              <button
                key={t.id}
                onClick={() => onNavigate('tickets')}
                className="group flex w-full items-center gap-3 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3 text-left transition-all duration-300 hover:border-ink-600 hover:bg-ink-800/50"
                style={{ animation: `staggerIn 0.4s ease-out ${i * 0.06}s both` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white">{t.subject}</p>
                  <p className="text-xs text-slate-500">{timeAgo(t.created_at)}</p>
                </div>
                <CategoryBadge category={t.category} />
                <StatusBadge status={t.status} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
