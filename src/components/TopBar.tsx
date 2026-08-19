import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import type { ViewKey } from '../types';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

const NAV_LABELS: Record<ViewKey, string> = {
  dashboard: 'Overview',
  tickets: 'Ticket Queue',
  analytics: 'Analytics',
  report: 'Weekly Report',
  forecast: 'Forecasting',
  compliance: 'Compliance',
  workflows: 'Workflows',
  deliverables: 'Deliverables',
};

interface TopBarProps {
  view: ViewKey;
  onNavigate: (v: ViewKey) => void;
}

export function TopBar({ view, onNavigate }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();

  const items: ViewKey[] = ['dashboard', 'tickets', 'analytics', 'report', 'forecast', 'compliance', 'workflows', 'deliverables'];

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-700/50 bg-ink-950/80 px-4 py-3 backdrop-blur lg:px-8 lg:pl-10">
        <div className="flex items-center gap-3 lg:hidden">
          <Logo size={32} />
          <span className="font-bold text-white">NexusDesk AI</span>
        </div>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-white">{NAV_LABELS[view]}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-ink-700/50 bg-ink-850 px-3 py-1.5 sm:flex">
            <span className="h-2 w-2 rounded-full bg-good-400" />
            <span className="text-xs text-slate-400">All systems operational</span>
          </div>
          <button onClick={() => setOpen(!open)} className="rounded-lg border border-ink-700/50 p-2 text-slate-300 lg:hidden">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur" onClick={() => setOpen(false)} />
          <nav className="absolute left-0 top-0 h-full w-64 border-r border-ink-700/50 bg-ink-900 p-4">
            <div className="mb-4 flex items-center gap-3">
              <Logo size={34} />
              <span className="font-bold text-white">NexusDesk AI</span>
            </div>
            <div className="space-y-1">
              {items.map((k) => (
                <button
                  key={k}
                  onClick={() => { onNavigate(k); setOpen(false); }}
                  className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${
                    view === k ? 'bg-brand-500/15 text-brand-300' : 'text-slate-400 hover:bg-ink-800'
                  }`}
                >
                  {NAV_LABELS[k]}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-ink-700/50 pt-4">
              <div className="mb-3 flex items-center gap-2 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 text-xs font-bold text-white">
                  {(user?.email ?? 'A')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{user?.email ?? 'Admin'}</p>
                  <p className="text-xs text-brand-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-ink-800 hover:text-danger-400"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
