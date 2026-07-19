import type { ScanStatus } from '../data/dummyData';

export const statusMeta: Record<ScanStatus, { label: string; color: string; bg: string; ring: string }> = {
  passed: { label: 'Passed', color: 'text-success', bg: 'bg-success/10', ring: 'ring-success/30' },
  warning: { label: 'Warning', color: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/30' },
  failed: { label: 'Failed', color: 'text-danger', bg: 'bg-danger/10', ring: 'ring-danger/30' },
  missing: { label: 'Missing', color: 'text-slate-400', bg: 'bg-white/5', ring: 'ring-white/10' },
};

export const scoreColor = (score: number): string => {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#FACC15';
  return '#EF4444';
};

export const scoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
};

export const impactMeta: Record<'High' | 'Medium' | 'Low', { color: string; bg: string }> = {
  High: { color: 'text-danger', bg: 'bg-danger/10 border-danger/30' },
  Medium: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  Low: { color: 'text-brand-300', bg: 'bg-brand-500/10 border-brand-500/30' },
};
