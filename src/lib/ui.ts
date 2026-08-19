import type { Category, Priority, TicketStatus, Tone } from '../types';

export const CATEGORY_META: Record<Category, { color: string; bg: string; label: string; icon: string }> = {
  IT: { color: 'text-brand-300', bg: 'bg-brand-500/15 border-brand-500/30', label: 'IT', icon: 'Cpu' },
  HR: { color: 'text-accent-300', bg: 'bg-accent-500/15 border-accent-500/30', label: 'HR', icon: 'Users' },
  Finance: { color: 'text-good-400', bg: 'bg-good-500/15 border-good-500/30', label: 'Finance', icon: 'PoundSterling' },
  Operations: { color: 'text-warn-400', bg: 'bg-warn-500/15 border-warn-500/30', label: 'Operations', icon: 'Building2' },
};

export const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
  Low: { color: 'text-slate-300', bg: 'bg-slate-500/15 border-slate-500/30' },
  Medium: { color: 'text-warn-400', bg: 'bg-warn-500/15 border-warn-500/30' },
  High: { color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  Critical: { color: 'text-danger-400', bg: 'bg-danger-500/15 border-danger-500/30' },
};

export const STATUS_META: Record<TicketStatus, { color: string; bg: string; dot: string }> = {
  Open: { color: 'text-accent-300', bg: 'bg-accent-500/15 border-accent-500/30', dot: 'bg-accent-400' },
  'In Progress': { color: 'text-warn-400', bg: 'bg-warn-500/15 border-warn-500/30', dot: 'bg-warn-400' },
  Resolved: { color: 'text-good-400', bg: 'bg-good-500/15 border-good-500/30', dot: 'bg-good-400' },
  Escalated: { color: 'text-danger-400', bg: 'bg-danger-500/15 border-danger-500/30', dot: 'bg-danger-400' },
};

export const TONE_META: Record<Tone, { label: string; color: string }> = {
  formal: { label: 'Formal', color: 'text-accent-300' },
  friendly: { label: 'Friendly', color: 'text-good-400' },
  urgent: { label: 'Urgent', color: 'text-danger-400' },
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
