import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
  accent?: 'brand' | 'accent' | 'warn' | 'danger' | 'good';
}

const ACCENT_MAP = {
  brand: { glow: 'from-brand-500/20 to-brand-500/5', text: 'text-brand-300', iconBg: 'bg-brand-500/15 text-brand-300 border-brand-500/20', ring: 'group-hover:shadow-brand-500/10' },
  accent: { glow: 'from-accent-500/20 to-accent-500/5', text: 'text-accent-300', iconBg: 'bg-accent-500/15 text-accent-300 border-accent-500/20', ring: 'group-hover:shadow-accent-500/10' },
  warn: { glow: 'from-warn-500/20 to-warn-500/5', text: 'text-warn-400', iconBg: 'bg-warn-500/15 text-warn-400 border-warn-500/20', ring: 'group-hover:shadow-warn-500/10' },
  danger: { glow: 'from-danger-500/20 to-danger-500/5', text: 'text-danger-400', iconBg: 'bg-danger-500/15 text-danger-400 border-danger-500/20', ring: 'group-hover:shadow-danger-500/10' },
  good: { glow: 'from-good-500/20 to-good-500/5', text: 'text-good-400', iconBg: 'bg-good-500/15 text-good-400 border-good-500/20', ring: 'group-hover:shadow-good-500/10' },
};

export function StatCard({ label, value, icon, trend, accent = 'accent' }: StatCardProps) {
  const a = ACCENT_MAP[accent];
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-850/80 p-5 shadow-card transition-all duration-300 hover-lift hover:border-ink-600 hover:shadow-card-hover ${a.ring}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${a.glow} opacity-60 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20" style={{ background: 'radial-gradient(circle, currentColor, transparent)' }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <div className={`rounded-xl border p-2.5 transition-transform duration-300 group-hover:scale-110 ${a.iconBg}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs">
          <TrendIcon
            size={14}
            className={
              trend.direction === 'up' ? 'text-good-400' : trend.direction === 'down' ? 'text-danger-400' : 'text-slate-400'
            }
          />
          <span className={trend.direction === 'up' ? 'text-good-400' : trend.direction === 'down' ? 'text-danger-400' : 'text-slate-400'}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
