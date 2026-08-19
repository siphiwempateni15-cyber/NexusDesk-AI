import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Calendar, Target, Zap } from 'lucide-react';
import type { Ticket } from '../types';
import { forecastSummary, buildForecast } from '../lib/forecast';
import { ForecastChart } from '../components/Charts';
import { StatCard } from '../components/StatCard';

interface ForecastProps {
  tickets: Ticket[];
}

export function Forecast({ tickets }: ForecastProps) {
  const summary = useMemo(() => forecastSummary(tickets), [tickets]);
  const points = useMemo(() => buildForecast(tickets), [tickets]);

  const direction = summary.changePercent > 5 ? 'up' : summary.changePercent < -5 ? 'down' : 'flat';
  const directionLabel = direction === 'up' ? 'Rising trend' : direction === 'down' ? 'Declining trend' : 'Stable';
  const workloadLevel = summary.projectedTotal > 15 ? 'High' : summary.projectedTotal > 8 ? 'Moderate' : 'Low';
  const workloadColor = workloadLevel === 'High' ? 'text-danger-400' : workloadLevel === 'Moderate' ? 'text-warn-400' : 'text-good-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-ink-700/40 bg-gradient-to-br from-ink-850 to-ink-900 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-2.5">
            <TrendingUp size={22} className="text-accent-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Predictive Insights</h2>
            <p className="mt-0.5 text-sm text-slate-400">Forecasting ticket volume and projected workload for the coming week</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Projected Volume" value={summary.projectedTotal} icon={<Target size={20} />} accent="accent" trend={{ value: `${Math.abs(summary.changePercent)}% vs last week`, direction }} />
        <StatCard label="Last Week Actual" value={summary.lastWeekActual} icon={<Calendar size={20} />} accent="brand" />
        <StatCard label="Trend" value={directionLabel} icon={direction === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />} accent={direction === 'up' ? 'warn' : 'good'} />
        <StatCard label="Workload Level" value={workloadLevel} icon={<Zap size={20} />} accent={workloadLevel === 'High' ? 'danger' : 'warn'} />
      </div>

      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">7-Day Volume Forecast</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-brand-400" /> Historical</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-accent-400" style={{ borderTop: '2px dashed #60a5fa' }} /> Projected</span>
          </div>
        </div>
        <ForecastChart data={points} height={280} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Forecast Breakdown</h3>
          <div className="space-y-2">
            {points.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3">
                <span className="w-10 text-sm font-medium text-slate-300">{p.label}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                      <div className="h-full rounded-full bg-accent-400" style={{ width: `${Math.min(p.projected * 12, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <span className="w-16 text-right text-sm font-semibold text-accent-300">{p.projected.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">Peak Day Prediction</h3>
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
                <p className="text-3xl font-bold text-accent-300">{summary.peakDay.label}</p>
                <p className="text-xs text-slate-400">{summary.peakDay.projected.toFixed(1)} tickets</p>
              </div>
              <p className="flex-1 text-sm text-slate-400">
                Based on historical day-of-week patterns and current trend momentum, {summary.peakDay.label} is projected to see the highest ticket volume. Plan staffing accordingly.
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${workloadLevel === 'High' ? 'border-danger-500/30 bg-danger-500/5' : workloadLevel === 'Moderate' ? 'border-warn-500/30 bg-warn-500/5' : 'border-good-500/30 bg-good-500/5'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className={workloadColor} />
              <h3 className={`text-sm font-semibold ${workloadColor}`}>Workload Recommendation</h3>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              {workloadLevel === 'High' && 'Projected volume is high. Consider pre-allocating additional resources and reviewing escalation thresholds to maintain SLA targets.'}
              {workloadLevel === 'Moderate' && 'Projected volume is moderate. Current staffing should be sufficient but monitor for category-specific surges.'}
              {workloadLevel === 'Low' && 'Projected volume is low. Good opportunity to address backlog and process improvement initiatives.'}
            </p>
          </div>

          <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
            <h3 className="mb-2 text-sm font-semibold text-white">Methodology</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              The forecast applies a 7-day rolling average weighted by day-of-week patterns. A trend factor is derived by comparing the most recent 3-day average against the weekly mean, adjusting projections upward (rising), downward (falling), or holding steady (stable).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
