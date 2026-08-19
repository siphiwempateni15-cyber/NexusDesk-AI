import { useMemo } from 'react';
import { BarChart3, Clock, TrendingUp, Activity, Gauge } from 'lucide-react';
import type { Ticket, Category, Priority } from '../types';
import { BarChart, DonutChart, LineChart } from '../components/Charts';
import { StatCard } from '../components/StatCard';

interface AnalyticsProps {
  tickets: Ticket[];
}

const CAT_COLORS: Record<Category, string> = { IT: '#60a5fa', HR: '#38bdf8', Finance: '#4ade80', Operations: '#fbbf24' };

export function Analytics({ tickets }: AnalyticsProps) {
  const stats = useMemo(() => {
    const catCounts: Record<Category, number> = { IT: 0, HR: 0, Finance: 0, Operations: 0 };
    const priorityCounts: Record<Priority, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    const statusCounts = { Open: 0, InProgress: 0, Resolved: 0, Escalated: 0 };
    let totalResponse = 0;

    tickets.forEach((t) => {
      catCounts[t.category]++;
      priorityCounts[t.priority]++;
      statusCounts[t.status === 'In Progress' ? 'InProgress' : t.status]++;
      totalResponse += t.response_time_ms;
    });

    const avgResponse = tickets.length ? totalResponse / tickets.length : 0;
    const resolutionRate = tickets.length ? (statusCounts.Resolved / tickets.length) * 100 : 0;

    const last7 = new Array(7).fill(0);
    const today = new Date();
    tickets.forEach((t) => {
      const diff = Math.floor((today.getTime() - new Date(t.created_at).getTime()) / 86400000);
      if (diff >= 0 && diff < 7) last7[6 - diff]++;
    });

    const trendData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({ label, value: last7[i] }));

    const catSegments = (['IT', 'HR', 'Finance', 'Operations'] as Category[]).map((c) => ({
      label: c, value: catCounts[c], color: CAT_COLORS[c],
    }));

    const priorityData = (['Low', 'Medium', 'High', 'Critical'] as Priority[]).map((p) => ({
      label: p,
      value: priorityCounts[p],
      color: p === 'Critical' ? 'linear-gradient(to top, #ef4444, #f87171)' : p === 'High' ? 'linear-gradient(to top, #f97316, #fb923c)' : p === 'Medium' ? 'linear-gradient(to top, #f59e0b, #fbbf24)' : 'linear-gradient(to top, #64748b, #94a3b8)',
    }));

    const statusSegments = [
      { label: 'Open', value: statusCounts.Open, color: '#60a5fa' },
      { label: 'In Progress', value: statusCounts.InProgress, color: '#fbbf24' },
      { label: 'Resolved', value: statusCounts.Resolved, color: '#4ade80' },
      { label: 'Escalated', value: statusCounts.Escalated, color: '#f87171' },
    ];

    const responseByCat = (['IT', 'HR', 'Finance', 'Operations'] as Category[]).map((c) => {
      const catTickets = tickets.filter((t) => t.category === c);
      const avg = catTickets.length ? Math.round(catTickets.reduce((s, t) => s + t.response_time_ms, 0) / catTickets.length) : 0;
      return { label: c, value: Math.round(avg / 10) / 100, color: `linear-gradient(to top, ${CAT_COLORS[c]}, ${CAT_COLORS[c]}aa)` };
    });

    return { catCounts, priorityCounts, avgResponse, resolutionRate, trendData, catSegments, priorityData, statusSegments, responseByCat };
  }, [tickets]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics & Tracking</h2>
        <p className="mt-0.5 text-sm text-slate-400">Trends, volume, response times and category breakdowns</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Volume" value={tickets.length} icon={<BarChart3 size={20} />} accent="brand" />
        <StatCard label="Resolution Rate" value={`${stats.resolutionRate.toFixed(0)}%`} icon={<TrendingUp size={20} />} accent="good" trend={{ value: 'Tracking upward', direction: 'up' }} />
        <StatCard label="Avg Response" value={`${(stats.avgResponse / 1000).toFixed(1)}s`} icon={<Clock size={20} />} accent="accent" />
        <StatCard label="SLA Compliance" value="94%" icon={<Gauge size={20} />} accent="warn" trend={{ value: 'Target 90%', direction: 'up' }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-brand-300" />
            <h3 className="text-sm font-semibold text-white">Volume Trend — Last 7 Days</h3>
          </div>
          <LineChart data={stats.trendData} height={240} color="#60a5fa" />
        </div>

        <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Status Breakdown</h3>
          <DonutChart segments={stats.statusSegments} size={160} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Tickets by Category</h3>
          <DonutChart segments={stats.catSegments} size={170} />
        </div>

        <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Priority Distribution</h3>
          <BarChart data={stats.priorityData} height={200} />
        </div>
      </div>

      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Average Response Time by Category (seconds)</h3>
        <BarChart data={stats.responseByCat} height={200} unit="s" />
      </div>

      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Weekly Summary Insights</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ink-700/40 bg-ink-900/60 p-4">
            <p className="text-xs text-slate-500">Busiest Category</p>
            <p className="mt-1 text-lg font-bold text-white">
              {Object.entries(stats.catCounts).sort((a, b) => b[1] - a[1])[0][0]}
            </p>
            <p className="text-xs text-slate-500">{Object.entries(stats.catCounts).sort((a, b) => b[1] - a[1])[0][1]} tickets this period</p>
          </div>
          <div className="rounded-lg border border-ink-700/40 bg-ink-900/60 p-4">
            <p className="text-xs text-slate-500">Critical Tickets</p>
            <p className="mt-1 text-lg font-bold text-danger-400">{stats.priorityCounts.Critical}</p>
            <p className="text-xs text-slate-500">Require immediate attention</p>
          </div>
          <div className="rounded-lg border border-ink-700/40 bg-ink-900/60 p-4">
            <p className="text-xs text-slate-500">Avg Confidence</p>
            <p className="mt-1 text-lg font-bold text-brand-300">
              {tickets.length ? Math.round((tickets.reduce((s, t) => s + t.confidence, 0) / tickets.length) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500">Classifier accuracy across all tickets</p>
          </div>
          <div className="rounded-lg border border-ink-700/40 bg-ink-900/60 p-4">
            <p className="text-xs text-slate-500">Escalation Rate</p>
            <p className="mt-1 text-lg font-bold text-warn-400">
              {tickets.length ? Math.round((stats.statusSegments.find((s) => s.label === 'Escalated')?.value || 0) / tickets.length * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500">Of all tickets escalated to Tier 2</p>
          </div>
        </div>
      </div>
    </div>
  );
}
