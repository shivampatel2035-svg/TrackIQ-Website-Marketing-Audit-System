import type { ScanApiResponse, ScanHistoryEntry } from '../context/ScanContext';
import type {
  AuditReport,
  TrackingTool,
  SeoItem,
  PerformanceItem,
  Recommendation,
  ScanStatus,
} from '../data/dummyData';

// Icon glyph for each of the 4 trackers this backend can ever detect
// (the fixed set defined in trackingDetector.js's SIGNATURES). This
// is a name -> icon lookup, not report data - every tracker always
// gets the same icon regardless of what any scan finds.
const TRACKING_ICONS: Record<string, string> = {
  'Google Analytics 4 (GA4)': 'BarChart3',
  'Google Tag Manager (GTM)': 'Tags',
  'Meta Pixel': 'Share2',
  'Microsoft Clarity': 'Eye',
};

// Presentation-only status banding for a numeric performance metric.
// Mirrors the deduction tiers already hardcoded in the (frozen)
// backend's performanceAnalyzer.js - e.g. page size > 1MB / > 5MB -
// so a metric that actually cost points shows as warning/failed
// instead of every row always reading "Passed". This does not change
// or duplicate the real score the backend calculated; it only colors
// the existing per-row badges using the same thresholds.
function tier(value: number, warnAbove: number, failAbove: number): ScanStatus {
  if (value > failAbove) return 'failed';
  if (value > warnAbove) return 'warning';
  return 'passed';
}

// Exact, verbatim strings recommendationEngine.js can produce (copied
// directly from that file - the backend is frozen, so this stays in
// sync as long as it isn't changed). category/impact classify this
// known, closed set of 15 possible messages for the existing card UI
// - they are never applied to arbitrary/unrecognized text.
const RECOMMENDATION_META: Record<
  string,
  { title: string; category: Recommendation['category']; impact: Recommendation['impact'] }
> = {
  'Install Google Analytics 4 (GA4) to track visitor behavior.': {
    title: 'Install Google Analytics 4',
    category: 'Tracking',
    impact: 'High',
  },
  'Install Google Tag Manager (GTM) to manage tracking tags more easily.': {
    title: 'Install Google Tag Manager',
    category: 'Tracking',
    impact: 'Medium',
  },
  'Install Meta Pixel to track and optimize Facebook/Instagram ad campaigns.': {
    title: 'Install Meta Pixel',
    category: 'Tracking',
    impact: 'High',
  },
  'Install Microsoft Clarity for free heatmaps and session recordings.': {
    title: 'Install Microsoft Clarity',
    category: 'Tracking',
    impact: 'Medium',
  },
  'Add a title tag to help search engines and users understand the page.': {
    title: 'Add a Title Tag',
    category: 'SEO',
    impact: 'High',
  },
  'Add a meta description to improve click-through rate from search results.': {
    title: 'Add a Meta Description',
    category: 'SEO',
    impact: 'Medium',
  },
  "Add an H1 heading to clarify the page's main topic for SEO.": {
    title: 'Add an H1 Heading',
    category: 'SEO',
    impact: 'Medium',
  },
  'Add Open Graph tags so the page looks good when shared on social media.': {
    title: 'Add Open Graph Tags',
    category: 'SEO',
    impact: 'Low',
  },
  'Create a robots.txt file to guide search engine crawlers.': {
    title: 'Create a robots.txt File',
    category: 'SEO',
    impact: 'Medium',
  },
  'Create a sitemap.xml file to help search engines index the site.': {
    title: 'Create a sitemap.xml File',
    category: 'SEO',
    impact: 'Medium',
  },
  'Reduce the number of JavaScript files to improve load speed.': {
    title: 'Reduce JavaScript Files',
    category: 'Performance',
    impact: 'Medium',
  },
  'Reduce the number of CSS files or combine them to improve load speed.': {
    title: 'Consolidate CSS Files',
    category: 'Performance',
    impact: 'Low',
  },
  'Reduce the number of images or compress them to improve load speed.': {
    title: 'Optimize Images',
    category: 'Performance',
    impact: 'Medium',
  },
  'Reduce overall page size (compress images, minify code) to improve load speed.': {
    title: 'Reduce Page Size',
    category: 'Performance',
    impact: 'High',
  },
  'Improve server response time or reduce page weight to speed up load time.': {
    title: 'Improve Load Time',
    category: 'Performance',
    impact: 'High',
  },
};

// The one non-actionable message recommendationEngine.js sends when
// no rule triggered. Dashboard.tsx checks for this and shows a clean
// "all clear" state instead of forcing it into a fixable-issue card.
export const NO_ISSUES_MESSAGE =
  'No major issues found. Keep monitoring tracking, SEO, and performance regularly.';

function shortHost(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Builds the AuditReport the dashboard already renders, entirely from
 * a real backend response - nothing here is hardcoded or fabricated.
 * `history` (this session's past scan scores, from ScanContext) fills
 * the trend chart, since the backend itself has no scan-history
 * endpoint to source that from.
 */
export function adaptReport(data: ScanApiResponse, history: ScanHistoryEntry[]): AuditReport {
  const tracking: TrackingTool[] = Object.entries(data.tracking.results).map(([name, resultValue]) => {
    const detail = data.tracking.details?.[name];
    return {
      name,
      description: detail?.reason ?? `${resultValue} on this page.`,
      status: resultValue === 'Detected' ? 'passed' : 'missing',
      score: detail?.confidence ?? (resultValue === 'Detected' ? 100 : 0),
      icon: TRACKING_ICONS[name] ?? 'Tags',
    };
  });

  const seo: SeoItem[] = Object.entries(data.seo.results).map(([label, value]) => ({
    label,
    value,
    status: value === 'Present' ? 'passed' : 'failed',
  }));

  const metrics = data.performance.metrics;
  const pageSizeMb = parseFloat(String(metrics['Page Size'])) || 0;
  const images = Number(metrics['Images']) || 0;
  const jsFiles = Number(metrics['JavaScript Files']) || 0;
  const cssFiles = Number(metrics['CSS Files']) || 0;
  const loadSeconds = parseFloat(String(metrics['Estimated Load Time'])) || 0;

  const performance: PerformanceItem[] = [
    { label: 'Page Size', value: String(metrics['Page Size'] ?? '—'), status: tier(pageSizeMb, 1, 5) },
    { label: 'Images', value: String(images), status: tier(images, 20, 100) },
    { label: 'JavaScript Files', value: String(jsFiles), status: tier(jsFiles, 10, 50) },
    { label: 'CSS Files', value: String(cssFiles), status: tier(cssFiles, 5, 15) },
    {
      label: 'Estimated Load Time',
      value: String(metrics['Estimated Load Time'] ?? '—'),
      status: tier(loadSeconds, 2.5, 7),
    },
  ];

  const actionableRecs = data.recommendations.filter((text) => text !== NO_ISSUES_MESSAGE);
  const recommendations: Recommendation[] = actionableRecs.map((text, i) => {
    const meta = RECOMMENDATION_META[text];
    return {
      id: `rec-${i}`,
      title: meta?.title ?? text,
      description: text,
      impact: meta?.impact ?? 'Medium',
      category: meta?.category ?? 'SEO',
    };
  });

  const trend = [...history.filter((h) => h.url !== data.url), { url: data.url, score: data.overall.score }].map(
    (h) => ({ label: shortHost(h.url), score: h.score })
  );

  return {
    url: data.url,
    scannedAt: new Date().toLocaleString('en-US', { hour12: false }),
    overallScore: data.overall.score,
    trackingScore: data.tracking.score,
    seoScore: data.seo.score,
    performanceScore: data.performance.score,
    tracking,
    seo,
    performance,
    recommendations,
    charts: {
      scoreBreakdown: [
        { name: 'Tracking', value: data.tracking.score, fill: '#6366F1' },
        { name: 'SEO', value: data.seo.score, fill: '#8B5CF6' },
        { name: 'Performance', value: data.performance.score, fill: '#22C55E' },
        { name: 'Overall', value: data.overall.score, fill: '#FACC15' },
      ],
      // Real file COUNTS (not fabricated KB weights - the backend
      // only counts these resource types, it never measures their
      // byte size individually). Charts.tsx's labels were updated to
      // match ("files", not "KB") so this is never mislabeled.
      resourceDistribution: [
        { name: 'Images', value: images, color: '#6366F1' },
        { name: 'JavaScript', value: jsFiles, color: '#8B5CF6' },
        { name: 'CSS', value: cssFiles, color: '#22C55E' },
      ],
      trend,
    },
  };
}
