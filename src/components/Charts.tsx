interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  unit?: string;
}

export function BarChart({ data, height = 200, unit = '' }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        return (
          <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-2">
            <span className="text-xs font-semibold text-slate-300 transition-all duration-300 group-hover:text-brand-300 group-hover:scale-110">
              {d.value}{unit}
            </span>
            <div
              className="relative w-full rounded-t-lg transition-all duration-500 hover:brightness-125"
              style={{
                height: Math.max(h, 2),
                background: d.color || 'linear-gradient(to top, #2563eb, #60a5fa)',
              }}
            >
              <div className="absolute inset-0 rounded-t-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{
                background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.15))',
              }} />
            </div>
            <span className="text-xs text-slate-500">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 220, color = '#60a5fa' }: LineChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((d.value - min) / range) * h;
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lineGrad)" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" vectorEffect="non-scaling-stroke" fill={color} />
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-slate-500">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ segments, size = 180 }: DonutProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(28,40,64,0.5)" strokeWidth="12" />
          {segments.map((seg, i) => {
            const fraction = seg.value / total;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{total}</span>
          <span className="text-xs text-slate-500">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm transition hover:translate-x-1">
            <span className="h-3 w-3 rounded-sm" style={{ background: seg.color }} />
            <span className="text-slate-300">{seg.label}</span>
            <span className="font-semibold text-white">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ForecastChartProps {
  data: { label: string; historical: number; projected: number }[];
  height?: number;
}

export function ForecastChart({ data, height = 240 }: ForecastChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.historical, d.projected]), 1);
  const w = 100;
  const h = 100;

  const histPoints = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * w,
    y: h - (d.historical / max) * h,
  }));
  const projPoints = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * w,
    y: h - (d.projected / max) * h,
  }));

  const histPath = histPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const projPath = projPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const projArea = `${projPath} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={projArea} fill="url(#projGrad)" />
        <path d={histPath} fill="none" stroke="#60a5fa" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {histPoints.map((p, i) => (
          <circle key={`h${i}`} cx={p.x} cy={p.y} r="1.8" vectorEffect="non-scaling-stroke" fill="#60a5fa" />
        ))}
        <path d={projPath} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {projPoints.map((p, i) => (
          <circle key={`p${i}`} cx={p.x} cy={p.y} r="1.8" vectorEffect="non-scaling-stroke" fill="#60a5fa" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-slate-500">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
