import type { ForecastPoint, Ticket } from '../types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getLast7DaysBuckets(tickets: Ticket[]): number[] {
  const buckets = new Array(7).fill(0);
  const today = new Date();
  for (const t of tickets) {
    const created = new Date(t.created_at);
    const diff = Math.floor((today.getTime() - created.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) {
      const dayIndex = created.getDay();
      buckets[dayIndex]++;
    }
  }
  return buckets;
}

export function buildForecast(tickets: Ticket[]): ForecastPoint[] {
  const historical = getLast7DaysBuckets(tickets);
  const total = historical.reduce((a, b) => a + b, 0) || 1;
  const avg = total / 7;

  const recent = historical.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const trend = recent > avg * 1.1 ? 'rising' : recent < avg * 0.9 ? 'falling' : 'stable';
  const trendFactor = trend === 'rising' ? 1.18 : trend === 'falling' ? 0.85 : 1.0;

  const dowWeights = [0.9, 1.0, 1.0, 0.95, 0.85, 0.4, 0.3];

  const result: ForecastPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const dow = (new Date().getDay() + i) % 7;
    const projected = Math.round(avg * trendFactor * dowWeights[dow] * 10) / 10;
    result.push({
      label: DAY_LABELS[dow],
      historical: historical[dow] || 0,
      projected: Math.max(0, projected),
    });
  }
  return result;
}

export function forecastSummary(tickets: Ticket[]) {
  const points = buildForecast(tickets);
  const projectedTotal = points.reduce((sum, p) => sum + p.projected, 0);
  const lastWeekActual = points.reduce((sum, p) => sum + p.historical, 0);
  const change = lastWeekActual > 0 ? ((projectedTotal - lastWeekActual) / lastWeekActual) * 100 : 0;

  return {
    points,
    projectedTotal: Math.round(projectedTotal),
    lastWeekActual,
    changePercent: Math.round(change * 10) / 10,
    peakDay: points.reduce((peak, p) => (p.projected > peak.projected ? p : peak), points[0]),
  };
}
