import {
  LayoutDashboard, ListTree, BarChart3, FileText, TrendingUp, ShieldCheck, Workflow, Rocket, LogOut, Calendar,
} from 'lucide-react';
import type { ViewKey } from '../types';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  current: ViewKey;
  onNavigate: (v: ViewKey) => void;
  ticketCount: number;
}

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard; sprint: string }[] = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard, sprint: 'Home' },
  { key: 'tickets', label: 'Ticket Queue', icon: ListTree, sprint: 'Sprint 2' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, sprint: 'Sprint 3' },
  { key: 'report', label: 'Weekly Report', icon: FileText, sprint: 'Sprint 4' },
  { key: 'forecast', label: 'Forecasting', icon: TrendingUp, sprint: 'Sprint 5' },
  { key: 'compliance', label: 'Compliance', icon: ShieldCheck, sprint: 'Sprint 6' },
  { key: 'workflows', label: 'Workflows', icon: Workflow, sprint: 'Sprint 7' },
  { key: 'deliverables', label: 'Deliverables', icon: Rocket, sprint: 'Capstone' },
  { key: 'week8', label: 'Week 8 Showcase', icon: Calendar, sprint: 'Showcase' },
];

export function Sidebar({ current, onNavigate, ticketCount }: SidebarProps) {
  const { user, signOut } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-700/50 bg-ink-900/95 backdrop-blur lg:flex">
      <div className="flex items-center gap-3 border-b border-ink-700/50 px-5 py-5">
        <Logo size={38} />
        <div>
          <h1 className="text-sm font-bold text-white">NexusDesk AI</h1>
          <p className="text-xs text-slate-500">Service Operations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = current === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? 'bg-brand-500/15 text-brand-300 shadow-glow'
                  : 'text-slate-400 hover:bg-ink-800 hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.key === 'tickets' && ticketCount > 0 && (
                <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-slate-300">{ticketCount}</span>
              )}
              {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-ink-700/50 px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl border border-ink-700/40 bg-ink-850 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 text-xs font-bold text-white">
            {(user?.email ?? 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-200">{user?.email ?? 'Admin'}</p>
            <p className="text-xs text-brand-400">Administrator</p>
          </div>
          <button onClick={signOut} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-ink-800 hover:text-danger-400" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
