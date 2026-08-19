import { useState } from 'react';
import type { ViewKey } from './types';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './views/Dashboard';
import { Tickets } from './views/Tickets';
import { Analytics } from './views/Analytics';
import { Report } from './views/Report';
import { Forecast } from './views/Forecast';
import { Compliance } from './views/Compliance';
import { Workflows } from './views/Workflows';
import { Deliverables } from './views/Deliverables';
import { Week8 } from './views/Week8';
import { AuthPage } from './views/AuthPage';
import { CustomerPortal } from './views/CustomerPortal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTickets, useAuditLogs, useApprovals, useNotifications } from './hooks/useData';
import { Loader2 } from 'lucide-react';

function AdminApp() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const { tickets, loading, reload } = useTickets();
  const { logs, loading: logsLoading } = useAuditLogs();
  const { approvals, loading: approvalsLoading, reload: reloadApprovals } = useApprovals();
  const { notifications, loading: notifsLoading, reload: reloadNotifications } = useNotifications();

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <Sidebar current={view} onNavigate={setView} ticketCount={tickets.filter((t) => t.status === 'Open').length} />

      <div className="lg:pl-64">
        <TopBar view={view} onNavigate={setView} />

        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          {view === 'dashboard' && <Dashboard tickets={tickets} onNavigate={setView} />}
          {view === 'tickets' && <Tickets tickets={tickets} loading={loading} onReload={reload} />}
          {view === 'analytics' && <Analytics tickets={tickets} />}
          {view === 'report' && <Report tickets={tickets} />}
          {view === 'forecast' && <Forecast tickets={tickets} />}
          {view === 'compliance' && <Compliance tickets={tickets} logs={logs} loading={logsLoading} />}
          {view === 'workflows' && (
            <Workflows
              tickets={tickets}
              approvals={approvals}
              notifications={notifications}
              loadingApprovals={approvalsLoading}
              loadingNotifications={notifsLoading}
              onReloadApprovals={reloadApprovals}
              onReloadNotifications={reloadNotifications}
              onReloadTickets={reload}
            />
          )}
          {view === 'deliverables' && <Deliverables />}
          {view === 'week8' && <Week8 />}
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (!session) return <AuthPage />;
  if (role === 'customer') return <CustomerPortal />;
  return <AdminApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
