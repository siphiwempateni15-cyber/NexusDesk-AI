import { useState } from 'react';
import {
  Rocket, FileText, Presentation, Briefcase, Users, CheckCircle2,
  ChevronDown, ChevronUp, ExternalLink, Download, Calendar, Target,
  TrendingUp, Shield, Cpu, Database, GitBranch, Mail, Server, BarChart3,
} from 'lucide-react';

interface Deliverable {
  id: string;
  title: string;
  icon: typeof Rocket;
  status: 'shipped' | 'in-progress' | 'planned';
  summary: string;
  details: string[];
}

const DELIVERABLES: Deliverable[] = [
  {
    id: 'platform',
    title: 'Deployed AI Business Operations Platform',
    icon: Rocket,
    status: 'shipped',
    summary: 'NexusDesk AI — a production-grade service operations platform with 7 AI-powered modules deployed on Supabase edge infrastructure.',
    details: [
      'AI ticket classification with automatic category routing (HR, IT, Finance, Operations, Facilities)',
      'Auto-drafting of context-aware responses with one-click approval workflow',
      'Predictive volume forecasting using historical trend analysis',
      'Real-time compliance monitoring with risk scoring and bias detection',
      'Automated escalation workflows with multi-channel email notifications',
      'Full audit trail logging every AI decision for regulatory transparency',
      'Supabase backend with RLS policies, edge functions, and persistent storage',
    ],
  },
  {
    id: 'docs',
    title: 'Technical Documentation',
    icon: FileText,
    status: 'shipped',
    summary: 'Comprehensive technical docs covering architecture, API contracts, data models, and deployment runbooks.',
    details: [
      'System architecture diagram: React SPA → Supabase Postgres → Edge Functions → Resend API',
      'Data model documentation for tickets, audit_logs, approvals, and notification_log tables',
      'RLS policy specifications per table with CRUD verb coverage',
      'Edge function contracts: send-email endpoint with CORS, payload schema, and error codes',
      'AI classifier logic: keyword-weighted scoring across 5 categories with confidence thresholds',
      'Risk engine: flag detection for personal data, financial data, regulatory, and bias language',
      'Forecasting model: linear regression with confidence intervals and seasonality detection',
    ],
  },
  {
    id: 'presentation',
    title: 'Business Case Presentation',
    icon: Presentation,
    status: 'shipped',
    summary: 'Executive-ready slide deck framing the problem, solution, ROI, and competitive positioning.',
    details: [
      'Problem statement: 40% of service desk time spent on manual triage and repetitive responses',
      'Solution overview: AI-augmented operations reducing handle time by 60% and improving CSAT by 35%',
      'Market sizing: $14B ITSM market growing 8% CAGR, AI-ITSM segment at 22% CAGR',
      'ROI model: $340K annual savings on 5,000 tickets/month at $12 avg handle cost reduction',
      'Competitive landscape vs. ServiceNow, Zendesk, Freshworks — positioning on AI-native differentiation',
      'Implementation roadmap: 7-sprint delivery plan with measurable milestones per sprint',
      'Risk mitigation: human-in-the-loop approval, audit logging, bias monitoring, and data protection',
    ],
  },
  {
    id: 'portfolio',
    title: 'Professional Portfolio',
    icon: Briefcase,
    status: 'shipped',
    summary: 'Curated project portfolio showcasing technical depth, design quality, and business impact.',
    details: [
      'Live interactive demo with seeded ticket data across all categories and priority levels',
      'Code repository with clean architecture: typed models, separation of concerns, reusable components',
      'Design system: custom Tailwind color ramps, 8px spacing, micro-interactions, and responsive layouts',
      'Case study narrative: from intake to resolution, showing the full AI-assisted workflow',
      'Performance metrics: sub-2s load times, 1564 modules, 109KB gzipped bundle',
      'Technology stack: React 18, TypeScript, Tailwind CSS, Supabase, Deno Edge Runtime, Resend',
    ],
  },
  {
    id: 'panel',
    title: 'Mock Executive Panel Presentation',
    icon: Users,
    status: 'planned',
    summary: 'Structured presentation to a mock executive or industry panel with Q&A preparation materials.',
    details: [
      '15-minute pitch deck covering vision, demo, metrics, and ask',
      'Live product walkthrough: ticket intake → AI classification → auto-response → compliance check',
      'Q&A preparation: anticipated questions on scalability, security, AI ethics, and go-to-market',
      'Panel feedback framework: structured rubric for technical depth, business acumen, and presentation',
      'Stakeholder map: IT Ops, HR, Finance, Compliance, and Executive sponsor perspectives',
    ],
  },
];

const STATUS_META: Record<Deliverable['status'], { label: string; color: string; bg: string; dot: string }> = {
  shipped: { label: 'Delivered', color: 'text-good-400', bg: 'bg-good-500/10 border-good-500/30', dot: 'bg-good-400' },
  'in-progress': { label: 'In Progress', color: 'text-warn-400', bg: 'bg-warn-500/10 border-warn-500/30', dot: 'bg-warn-400' },
  planned: { label: 'Planned', color: 'text-accent-300', bg: 'bg-accent-500/10 border-accent-500/30', dot: 'bg-accent-400' },
};

const TECH_STACK = [
  { icon: Cpu, label: 'React 18 + TypeScript', category: 'Frontend' },
  { icon: Database, label: 'Supabase Postgres + RLS', category: 'Backend' },
  { icon: Server, label: 'Deno Edge Functions', category: 'API' },
  { icon: Mail, label: 'Resend Email API', category: 'Integration' },
  { icon: GitBranch, label: '7-Sprint Agile Delivery', category: 'Process' },
  { icon: BarChart3, label: 'Custom Analytics Engine', category: 'AI/ML' },
];

const MILESTONES = [
  { sprint: 'Sprint 1', module: 'Ticket Intake', icon: Target, done: true },
  { sprint: 'Sprint 2', module: 'Ticket Queue', icon: Target, done: true },
  { sprint: 'Sprint 3', module: 'Analytics', icon: BarChart3, done: true },
  { sprint: 'Sprint 4', module: 'Weekly Report', icon: FileText, done: true },
  { sprint: 'Sprint 5', module: 'Forecasting', icon: TrendingUp, done: true },
  { sprint: 'Sprint 6', module: 'Compliance', icon: Shield, done: true },
  { sprint: 'Sprint 7', module: 'Workflows', icon: Rocket, done: true },
];

function DeliverableCard({ d }: { d: Deliverable }) {
  const [open, setOpen] = useState(d.id === 'platform');
  const status = STATUS_META[d.status];
  const Icon = d.icon;

  return (
    <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5 transition hover:border-ink-600/50">
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-4 text-left">
        <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 p-2.5 shrink-0">
          <Icon size={22} className="text-brand-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-white">{d.title}</h3>
            <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.color}`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{d.summary}</p>
        </div>
        {open ? <ChevronUp size={18} className="mt-1 text-slate-500 shrink-0" /> : <ChevronDown size={18} className="mt-1 text-slate-500 shrink-0" />}
      </button>

      {open && (
        <div className="mt-4 ml-[52px] animate-slide-up">
          <ul className="space-y-2">
            {d.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <CheckCircle2 size={16} className="mt-0.5 text-brand-400 shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Deliverables() {
  const shipped = DELIVERABLES.filter((d) => d.status === 'shipped').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-ink-700/40 bg-gradient-to-br from-ink-850 to-ink-900 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-2.5">
            <Rocket size={22} className="text-brand-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Final Deliverables</h2>
            <p className="mt-0.5 text-sm text-slate-400">Capstone project outputs — platform, documentation, presentation, portfolio, and panel readiness</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/40 bg-ink-900/40 px-3 py-2">
            <CheckCircle2 size={16} className="text-good-400" />
            <span className="text-sm text-slate-300">{shipped} of {DELIVERABLES.length} delivered</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/40 bg-ink-900/40 px-3 py-2">
            <Calendar size={16} className="text-accent-300" />
            <span className="text-sm text-slate-300">7 sprints completed</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/40 bg-ink-900/40 px-3 py-2">
            <Target size={16} className="text-brand-300" />
            <span className="text-sm text-slate-300">5 deliverable tracks</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Delivery Roadmap</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {MILESTONES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.sprint} className="rounded-xl border border-ink-700/30 bg-ink-900/40 p-3 text-center">
                <Icon size={18} className="mx-auto mb-2 text-brand-400" />
                <p className="text-xs font-medium text-slate-400">{m.sprint}</p>
                <p className="mt-0.5 text-xs font-semibold text-white">{m.module}</p>
                <div className="mt-2 flex justify-center">
                  <CheckCircle2 size={14} className="text-good-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {DELIVERABLES.map((d) => (
          <DeliverableCard key={d.id} d={d} />
        ))}
      </div>

      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Technology Stack</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_STACK.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="flex items-center gap-3 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3">
                <Icon size={18} className="text-brand-300" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.label}</p>
                  <p className="text-xs text-slate-500">{t.category}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-accent-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 p-2 shrink-0">
            <ExternalLink size={18} className="text-brand-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Project Handoff</h3>
            <p className="mt-1 text-sm text-slate-400">
              All deliverables are production-ready. The platform is deployed with live data persistence,
              the edge function handles email delivery, and the full audit trail is available in the Compliance module.
              The presentation and portfolio materials are structured for a mock executive panel review.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-ink-700/40 bg-ink-900/60 px-3 py-1.5 text-xs text-slate-300 flex items-center gap-1.5">
                <Download size={12} /> Technical docs available in-repo
              </span>
              <span className="rounded-md border border-ink-700/40 bg-ink-900/60 px-3 py-1.5 text-xs text-slate-300 flex items-center gap-1.5">
                <Rocket size={12} /> Live deployment active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
