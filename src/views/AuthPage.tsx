import { useState } from 'react';
import { Brain, Mail, Lock, Loader2, ArrowRight, Sparkles, ShieldCheck, Zap, TrendingUp, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSuccess('Account created! You can now sign in.');
        setMode('signin');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* Left: Marketing showcase */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-accent-800 p-12 lg:flex">
        {/* Decorative grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-accent-500/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <Logo size={44} />
          <div>
            <h1 className="text-xl font-bold text-white">NexusDesk AI</h1>
            <p className="text-xs text-brand-200">Service Operations Platform</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300">
              <Sparkles size={14} />
              AI-Powered Service Operations
            </div>
            <h2 className="text-4xl font-bold leading-tight text-white">
              Resolve tickets faster<br />
              with <span className="animated-gradient-text">intelligent automation</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100">
              Classify, route, respond, and monitor compliance — all powered by AI.
              Built for modern service desks that demand speed, accuracy, and governance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: Zap, title: 'AI Classification', desc: 'Auto-routes tickets in <1s' },
              { icon: ShieldCheck, title: 'Compliance Engine', desc: 'Risk scoring & bias detection' },
              { icon: TrendingUp, title: 'Forecasting', desc: 'Predict volume & staffing' },
              { icon: Brain, title: 'Smart Responses', desc: 'Context-aware drafting' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur transition-all duration-300 hover-lift hover:border-brand-500/30 hover:shadow-card-hover"
                  style={{ animation: `staggerIn 0.5s ease-out ${i * 0.1}s both` }}
                >
                  <div className="mb-2 inline-flex rounded-lg bg-brand-500/10 p-2 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={20} className="text-brand-300" />
                  </div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-xs text-brand-200">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-brand-200">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-good-400" /> 99.9% Uptime</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-400" /> SOC 2 Ready</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-400" /> GDPR Compliant</span>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Logo size={40} />
            <div>
              <h1 className="text-lg font-bold text-white">NexusDesk AI</h1>
              <p className="text-xs text-slate-400">Service Operations</p>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-700/60 bg-ink-850/80 p-8 shadow-card backdrop-blur">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {mode === 'signin'
                  ? 'Sign in to access your dashboard'
                  : 'Join NexusDesk AI in seconds — no credit card required'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="mb-6 flex rounded-xl border border-ink-700/50 bg-ink-900 p-1">
              <button
                onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === 'signin' ? 'bg-brand-500/15 text-brand-300 shadow-glow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === 'signup' ? 'bg-brand-500/15 text-brand-300 shadow-glow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-brand-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full rounded-lg border border-ink-700/50 bg-ink-900 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-brand-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    required
                    className="w-full rounded-lg border border-ink-700/50 bg-ink-900 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400 animate-slide-up">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-danger-400" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-good-500/30 bg-good-500/10 px-4 py-3 text-sm text-good-400 animate-slide-up">
                  <CheckCircle2 size={16} className="shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 hover:shadow-glow-lg disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {mode === 'signup' && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-ink-700/30 bg-ink-900/40 p-3">
                <User size={16} className="mt-0.5 shrink-0 text-slate-500" />
                <p className="text-xs text-slate-500">
                  New accounts are created as <span className="text-slate-300">customers</span>.
                  You can submit tickets and track their status. Admin access is granted separately.
                </p>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
