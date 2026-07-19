export type ScanStatus = 'passed' | 'warning' | 'failed' | 'missing';

export interface TrackingTool {
  name: string;
  description: string;
  status: ScanStatus;
  score: number;
  icon: string;
}

export interface SeoItem {
  label: string;
  value: string;
  status: ScanStatus;
}

export interface PerformanceItem {
  label: string;
  value: string;
  sub?: string;
  status: ScanStatus;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  category: 'Tracking' | 'SEO' | 'Performance' | 'Conversion';
}

export interface AuditReport {
  url: string;
  scannedAt: string;
  overallScore: number;
  trackingScore: number;
  seoScore: number;
  performanceScore: number;
  tracking: TrackingTool[];
  seo: SeoItem[];
  performance: PerformanceItem[];
  recommendations: Recommendation[];
  charts: {
    scoreBreakdown: { name: string; value: number; fill: string }[];
    resourceDistribution: { name: string; value: number; color: string }[];
    trend: { label: string; score: number }[];
  };
}

// NOTE: the dummyReport mock object (hardcoded 78/72/84/68 scores,
// acme.io placeholder, fake SEO/performance/recommendation copy) has
// been removed. Real report data now comes from the backend via
// ScanContext + src/utils/adaptReport.ts, which builds an AuditReport
// (using the types below) directly from the live /api/scan response.
// The type exports below are kept as-is since every dashboard
// component still imports its prop types from here.

export const loadingSteps = [
  'Scanning Website',
  'Checking Tracking',
  'Analyzing SEO',
  'Measuring Performance',
  'Generating Recommendations',
  'Preparing PDF Report',
];

export const features = [
  {
    icon: 'Radar',
    title: 'Tracking Audit',
    description: 'Detect GA4, GTM, Meta Pixel & Microsoft Clarity with firing validation and consent-state checks.',
    accent: 'from-brand-500 to-accent-500',
  },
  {
    icon: 'Search',
    title: 'SEO Analysis',
    description: 'Evaluate meta tags, headings, Open Graph, robots and sitemap health against best practices.',
    accent: 'from-accent-500 to-brand-500',
  },
  {
    icon: 'Gauge',
    title: 'Performance Insights',
    description: 'Measure page weight, asset breakdown, load time and Core Web Vitals with clear targets.',
    accent: 'from-success to-brand-500',
  },
  {
    icon: 'Sparkles',
    title: 'AI Recommendations',
    description: 'Receive prioritized, actionable fixes ranked by impact — no guesswork, just clarity.',
    accent: 'from-warning to-accent-500',
  },
  {
    icon: 'FileBarChart',
    title: 'PDF Reports',
    description: 'Export a polished, shareable audit report for stakeholders and clients in one click.',
    accent: 'from-brand-500 to-success',
  },
  {
    icon: 'ShieldCheck',
    title: 'Privacy-First',
    description: 'Audits run without cookies or tracking. Your URLs and reports never leave your workspace.',
    accent: 'from-accent-500 to-success',
  },
];

export const howItWorks = [
  { step: '01', title: 'Enter a URL', description: 'Paste any website address into the scan bar — no login or setup required.' },
  { step: '02', title: 'Run the Audit', description: 'TrackIQ inspects tracking, SEO and performance in seconds.' },
  { step: '03', title: 'Get the Report', description: 'Review scores, charts and prioritized recommendations, then export.' },
];

export const faqs = [
  {
    q: 'Do I need to install anything on my website?',
    a: 'No. TrackIQ analyzes public pages remotely — no script, plugin or code changes required on your site.',
  },
  {
    q: 'How long does an audit take?',
    a: 'A full audit typically completes in under 30 seconds, depending on the size and complexity of the page.',
  },
  {
    q: 'Is my data stored or shared?',
    a: 'Audited URLs and generated reports are tied to your workspace and never shared with third parties.',
  },
  {
    q: 'Can I export reports for clients?',
    a: 'Yes. Every audit can be downloaded as a branded PDF or copied as a shareable summary link.',
  },
];
