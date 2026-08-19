import { useState } from 'react';
import {
  Rocket, Target, CheckCircle2, ChevronDown, ChevronUp, Users, GraduationCap,
  Award, Briefcase, FileText, Presentation, TrendingUp, Calendar, Sparkles,
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
    summary: 'Production-grade AI service operations platform deployed on Supabase edge infrastructure.',
    details: [
      'AI ticket classification with automatic category routing across HR, IT, Finance, and Operations',
      'Auto-drafting of context-aware responses with one-click approval workflow',
      'Predictive volume forecasting using historical trend analysis',
      'Real-time compliance monitoring with risk scoring and bias detection',
      'Automated escalation workflows with multi-channel email notifications',
      'Full audit trail logging every AI decision for regulatory transparency',
      'Supabase backend with row-level security, edge functions, and persistent storage',
    ],
  },
  {
    id: 'docs',
    title: 'Technical Documentation',
    icon: FileText,
    status: 'shipped',
    summary: 'Comprehensive technical docs covering architecture, data models, and deployment runbooks.',
    details: [
      'System architecture: React SPA, Supabase Postgres, Edge Functions, Resend API',
      'Data model documentation for tickets, audit logs, approvals, and notification log',
      'Row-level security policy specifications per table with full CRUD coverage',
      'Edge function contracts with CORS, payload schema, and error codes',
      'AI classifier logic: keyword-weighted scoring across categories with confidence thresholds',
      'Risk and bias engine: flag detection for personal data, financial data, and biased language',
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
      'Competitive landscape vs. ServiceNow, Zendesk, Freshworks',
      'Implementation roadmap: 8-sprint delivery plan with measurable milestones per sprint',
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
    title: 'Mock Executive / Industry Panel Presentation',
    icon: Users,
    status: 'in-progress',
    summary: 'Structured presentation to a mock executive or industry panel with Q&A preparation materials.',
    details: [
      '15-minute pitch deck covering vision, demo, metrics, and ask',
      'Live product walkthrough: ticket intake, AI classification, auto-response, compliance check',
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

const MAPPED_ROLES = [
  { icon: GraduationCap, label: 'AI Intern', desc: 'Classifier tuning, model evaluation, and AI response quality assurance' },
  { icon: TrendingUp, label: 'Junior Analyst', desc: 'Analytics dashboards, forecasting models, and reporting metrics' },
  { icon: Rocket, label: 'Automation Specialist', desc: 'Workflow automation, edge functions, and integration pipelines' },
  { icon: Users, label: 'Support Roles', desc: 'Ticket queue management, customer portal, and escalation handling' },
];

const RUBRIC = [
  {
    category: 'Technical Skills',
    weight: 40,
    icon: Target,
    color: 'text-brand-300',
    bg: 'bg-brand-500/10 border-brand-500/30',
    items: [
      'Portfolio completeness — all modules built, deployed, and functional',
      'Code quality — typed, modular, documented, and maintainable',
      'AI/ML implementation — classification, forecasting, and bias detection working end-to-end',
      'Infrastructure — database, RLS, edge functions, and persistent storage configured',
    ],
  },
  {
    category: 'Professional Skills',
    weight: 60,
    icon: Award,
    color: 'text-accent-300',
    bg: 'bg-accent-500/10 border-accent-500/30',
    items: [
      'Communication — clear articulation of problem, solution, and value proposition',
      'Branding — cohesive visual identity, design system, and product naming',
      'Presentation — structured delivery, live demo, and executive-level framing',
      'Stakeholder engagement — Q&A readiness, audience awareness, and confidence under pressure',
    ],
  },
];

const ALIGNMENT = [
  'Demonstrate applied competence across AI, data, automation, and service operations',
  'Showcase workplace readiness through real-world problem solving and delivery ownership',
  'Bridge technical depth with business acumen in a panel-ready format',
  'Prove end-to-end capability: from sprint planning to deployed product to executive presentation',
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

export function Week8() {
  const shipped = DELIVERABLES.filter((d) => d.status === 'shipped').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-6 shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3">
            <Rocket size={24} className="text-brand-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Week 8 — Deployment, Optimisation & Industry Showcase</h2>
            <p className="mt-0.5 text-sm text-slate-400">27–31 July · Final sprint — finalise and deploy</p>
          </div>
        </div>

        <div className="relative mt-5 rounded-xl border border-ink-700/40 bg-ink-900/50 p-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-brand-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">Sprint Goal</span>
          </div>
          <p className="mt-2 text-sm text-slate-200">Finalise and deploy the AI Business Operations Platform — all modules production-ready, documentation complete, and candidates prepared to present to a mock executive or industry panel.</p>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/40 bg-ink-900/40 px-3 py-2">
            <CheckCircle2 size={16} className="text-good-400" />
            <span className="text-sm text-slate-300">{shipped} of {DELIVERABLES.length} deliverables shipped</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/40 bg-ink-900/40 px-3 py-2">
            <Calendar size={16} className="text-accent-300" />
            <span className="text-sm text-slate-300">Week 8 of 8-sprint plan</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/40 bg-ink-900/40 px-3 py-2">
            <Users size={16} className="text-brand-300" />
            <span className="text-sm text-slate-300">4 mapped roles</span>
          </div>
        </div>
      </div>

      {/* Final Deliverables */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Briefcase size={18} className="text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Final Deliverables</h3>
        </div>
        <div className="space-y-4">
          {DELIVERABLES.map((d) => (
            <DeliverableCard key={d.id} d={d} />
          ))}
        </div>
      </div>

      {/* Mapped Roles */}
      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Mapped Roles</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MAPPED_ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-start gap-3 rounded-xl border border-ink-700/30 bg-ink-900/40 p-4 transition hover:border-brand-500/30 hover:bg-ink-900/70">
                <div className="rounded-lg border border-brand-500/20 bg-brand-500/10 p-2 shrink-0">
                  <Icon size={18} className="text-brand-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{r.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grading Rubric */}
      <div className="rounded-2xl border border-ink-700/40 bg-ink-850/80 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Award size={18} className="text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Grading Rubric</h3>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {RUBRIC.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.category} className={`rounded-xl border p-5 ${r.bg}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={r.color} />
                    <h4 className="text-base font-semibold text-white">{r.category}</h4>
                  </div>
                  <span className={`rounded-lg border px-3 py-1 text-sm font-bold ${r.bg} ${r.color}`}>
                    {r.weight}%
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {r.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {/* Weight bar */}
                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-900/60">
                    <div
                      className={`h-full rounded-full ${r.category === 'Technical Skills' ? 'bg-brand-500' : 'bg-accent-500'}`}
                      style={{ width: `${r.weight}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alignment */}
      <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-accent-500/5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-brand-300" />
          <h3 className="text-lg font-semibold text-white">Alignment</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ALIGNMENT.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-ink-700/30 bg-ink-900/40 p-4">
              <CheckCircle2 size={16} className="mt-0.5 text-brand-400 shrink-0" />
              <span className="text-sm text-slate-200">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
