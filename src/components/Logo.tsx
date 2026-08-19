import { Brain } from 'lucide-react';

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 shadow-glow"
      style={{ width: size, height: size }}
    >
      <Brain size={size * 0.55} className="text-white" strokeWidth={2.2} />
    </div>
  );
}
