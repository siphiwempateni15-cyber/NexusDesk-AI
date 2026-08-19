import type { RiskResult, Category, Priority } from '../types';

interface RiskInput {
  body: string;
  category: Category;
  priority: Priority;
}

const SENSITIVE_PATTERNS: { flag: string; terms: string[] }[] = [
  { flag: 'personal_data', terms: ['name', 'address', 'dob', 'date of birth', 'national insurance', 'passport', 'email', 'phone'] },
  { flag: 'financial_data', terms: ['salary', 'payslip', 'invoice', 'payment', 'bank', 'card', 'budget', 'cost', 'amount', '£'] },
  { flag: 'regulatory', terms: ['gdpr', 'data subject', 'compliance', 'audit', 'legal', 'regulator', 'ico'] },
  { flag: 'high_value_transaction', terms: ['budget', 'approval', 'procurement', 'contract', 'tender', '£10', '£20', '£50'] },
];

const BIAS_RISK_TERMS: string[] = [];

export function evaluateRisk({ body, priority }: RiskInput): RiskResult {
  const lower = body.toLowerCase();
  const flags: string[] = [];
  const notes: string[] = [];

  for (const { flag, terms } of SENSITIVE_PATTERNS) {
    if (terms.some((t) => lower.includes(t))) {
      flags.push(flag);
      notes.push(`Detected ${flag.replace(/_/g, ' ')} — response must avoid exposing protected attributes.`);
    }
  }

  const biasHits = BIAS_RISK_TERMS.filter((t) => lower.includes(t));
  if (biasHits.length >= 2) {
    flags.push('potential_bias_language');
    notes.push('Request references protected characteristics. Review generated response for neutral, inclusive phrasing.');
  }

  let score = flags.length * 12;
  if (priority === 'Critical') score += 15;
  if (priority === 'High') score += 8;
  score = Math.min(100, score);

  if (score === 0) {
    notes.push('No sensitive data or bias indicators detected. Low compliance risk.');
  }

  if (flags.includes('regulatory')) {
    notes.push('Regulatory subject detected — mandatory human review before any automated response is sent.');
  }

  return { riskScore: score, riskFlags: flags, notes };
}
