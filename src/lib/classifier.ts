import type { Category, ClassificationResult, Priority, BiasCheck } from '../types';

interface CategoryProfile {
  category: Category;
  department: string;
  keywords: string[];
  priorityBias: Priority;
}

const PROFILES: CategoryProfile[] = [
  {
    category: 'IT',
    department: 'IT Service Desk',
    priorityBias: 'High',
    keywords: [
      'password', 'login', 'vpn', 'email', 'server', 'network', 'laptop', 'hardware',
      'software', 'system', 'access', 'account', 'error', 'bug', 'crash', 'internet',
      'connection', 'outlook', 'reset', 'log in', 'sign in', 'outbox', 'client',
      'desktop', 'wifi', 'configuration', 'install', 'update', 'token',
    ],
  },
  {
    category: 'HR',
    department: 'Human Resources',
    priorityBias: 'Medium',
    keywords: [
      'payroll', 'payslip', 'leave', 'holiday', 'salary', 'contract', 'onboarding',
      'offboarding', 'grievance', 'holiday', 'annual leave', 'sick', 'benefits',
      'pension', 'hr', 'manager', 'employee', 'staff', 'performance', 'gdpr',
      'data subject', 'recruitment', 'policy', 'harassment', 'complaint',
    ],
  },
  {
    category: 'Finance',
    department: 'Finance Operations',
    priorityBias: 'Medium',
    keywords: [
      'invoice', 'budget', 'expense', 'reimbursement', 'payment', 'purchase',
      'procurement', 'vendor', 'supplier', 'po number', 'cost centre', 'approval',
      'spend', 'travel', 'receipt', 'accounts', 'payable', 'tax', 'forecast',
      'capex', 'opex', 'billing', 'refund', 'salary',
    ],
  },
  {
    category: 'Operations',
    department: 'Operations & Facilities',
    priorityBias: 'Medium',
    keywords: [
      'office', 'facilities', 'air conditioning', 'heating', 'cleaning', 'desk',
      'room booking', 'maintenance', 'repair', 'catering', 'parking', 'building',
      'security', 'access card', 'printer', 'stationery', 'delivery', 'logistics',
      'reservation', 'booking', 'workspace', 'floor', 'meeting room',
    ],
  },
];

const URGENCY_TOKENS = [
  'urgent', 'asap', 'immediately', 'critical', 'emergency', 'down', 'outage',
  'cannot work', 'blocking', 'stuck', 'not working', 'stopped', 'broken',
  'deadline', 'today', 'right now', 'production', 'system down', 'deadline today',
  'time sensitive', 'time-sensitive', 'priority', 'help me now', 'need this now',
];

const LOW_TOKENS = ['when possible', 'no rush', 'friendly', 'just wondering', 'question'];

const BIAS_TERMS: { flag: string; terms: string[] }[] = [
  { flag: 'gender_bias', terms: ['he', 'she', 'him', 'her', 'his', 'hers', 'guys', 'ladies', 'gentlemen'] },
  { flag: 'age_bias', terms: ['elderly', 'old man', 'old woman', 'young kid', 'teenager', 'millennial', 'boomer'] },
  { flag: 'disability_bias', terms: ['disabled', 'handicapped', 'wheelchair', 'crippled', 'retarded', 'special needs'] },
  { flag: 'racial_bias', terms: ['race', 'racial', 'ethnic', 'minority', 'immigrant', 'foreigner'] },
  { flag: 'religious_bias', terms: ['religion', 'religious', 'muslim', 'christian', 'jewish', 'atheist', 'hindu'] },
  { flag: 'appearance_bias', terms: ['overweight', 'fat', 'ugly', 'beautiful', 'attractive', 'looks'] },
];

function countMatches(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k));
}

function derivePriority(text: string, base: Priority): Priority {
  const lower = text.toLowerCase();
  if (URGENCY_TOKENS.some((t) => lower.includes(t))) return 'Critical';
  if (LOW_TOKENS.some((t) => lower.includes(t))) return 'Low';
  return base;
}

function checkBias(text: string): BiasCheck {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  for (const { flag, terms } of BIAS_TERMS) {
    if (terms.some((t) => lower.includes(t))) {
      flags.push(flag);
    }
  }
  if (flags.length === 0) {
    return { detected: false, flags: [], note: 'No biased language detected. The request appears neutral and inclusive.' };
  }
  return {
    detected: true,
    flags,
    note: `Potential bias detected (${flags.map((f) => f.replace(/_/g, ' ')).join(', ')}). The AI response will use neutral, inclusive language.`,
  };
}

export function classify(subject: string, body: string): ClassificationResult {
  const text = `${subject} ${body}`;

  const scores = PROFILES.map((p) => {
    const matches = countMatches(text, p.keywords);
    return { profile: p, matches, score: matches.length };
  });

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  if (!best || best.score === 0) {
    return {
      category: 'IT',
      priority: derivePriority(text, 'Medium'),
      confidence: 0.5,
      matchedKeywords: [],
      department: 'IT Service Desk',
      biasCheck: checkBias(text),
      relevant: false,
    };
  }

  const runnerUp = scores[1];
  const total = scores.reduce((sum, s) => sum + s.score, 0) || 1;
  const share = best.score / total;
  const margin = runnerUp ? (best.score - runnerUp.score) / Math.max(best.score, 1) : 1;
  const confidence = Math.min(0.99, Math.round((0.55 * share + 0.45 * margin) * 100) / 100);

  return {
    category: best.profile.category,
    priority: derivePriority(text, best.profile.priorityBias),
    confidence,
    matchedKeywords: best.matches.slice(0, 8),
    department: best.profile.department,
    biasCheck: checkBias(text),
    relevant: true,
  };
}
