import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useNavigate, Navigate } from 'react-router-dom';
import { Download, Copy, RefreshCw, Globe, Calendar, ShieldCheck, PartyPopper, Loader2, AlertCircle } from 'lucide-react';
import { useScan } from '../context/ScanContext';
import { adaptReport, NO_ISSUES_MESSAGE } from '../utils/adaptReport';
import { ScoreGauge } from '../components/ScoreGauge';
import { TrackingCard } from '../components/TrackingCard';
import { SeoCard } from '../components/SeoCard';
import { PerformanceCard } from '../components/PerformanceCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { Charts } from '../components/Charts';

export function Dashboard() {
  const { report, history, reset, pdfStatus, pdfError, downloadPdf } = useScan();
  const navigate = useNavigate();

  // Reached directly (e.g. a page refresh) with no scan in memory -
  // ScanContext's state doesn't persist across a reload, so send back
  // to the landing page instead of rendering with nothing to show.
  if (!report) {
    return <Navigate to="/" replace />;
  }

  const r = adaptReport(report, history);
  const isAllClear = report.recommendations.length === 1 && report.recommendations[0] === NO_ISSUES_MESSAGE;

  const copyReport = () => {
    const text = `TrackIQ Report\nURL: ${r.url}\nOverall: ${r.overallScore}\nTracking: ${r.trackingScore}\nSEO: ${r.seoScore}\nPerformance: ${r.performanceScore}`;
    navigator.clipboard?.writeText(text);
  };

  const scanAnother = () => {
    reset();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-32">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl gradient-border p-1.5"
      >
        <div className="relative rounded-[1.35rem] bg-ink-800/80 p-6 backdrop-blur-xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />

          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <Globe className="h-3.5 w-3.5 text-brand-400" /> {r.url}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  <Calendar className="h-3.5 w-3.5 text-accent-400" /> {r.scannedAt}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Marketing Health Report
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                A complete audit of tracking, SEO and performance — with prioritized recommendations to improve your score.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => downloadPdf(report.url)}
                  disabled={pdfStatus === 'generating'}
                  className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pdfStatus === 'generating' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Download PDF
                    </>
                  )}
                </button>
                <button onClick={copyReport} className="btn-ghost text-sm">
                  <Copy className="h-4 w-4" /> Copy Report
                </button>
                <button onClick={scanAnother} className="btn-ghost text-sm">
                  <RefreshCw className="h-4 w-4" /> Scan Another
                </button>
              </div>
              {pdfStatus === 'error' && pdfError && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {pdfError}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center">
              <ScoreGauge score={r.overallScore} size={220} />
              <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">Marketing Health</p>
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
            {[
              { label: 'Tracking', value: r.trackingScore, color: 'text-brand-400' },
              { label: 'SEO', value: r.seoScore, color: 'text-accent-400' },
              { label: 'Performance', value: r.performanceScore, color: 'text-success' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl font-bold sm:text-3xl">
                  <span className={s.color}>
                    <CountUp end={s.value} duration={1.6} />
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <TrackingCard tools={r.tracking} score={r.trackingScore} />
        <SeoCard items={r.seo} score={r.seoScore} />
        <PerformanceCard items={r.performance} score={r.performanceScore} />
      </div>

      {/* Charts */}
      <div className="mt-6">
        <Charts report={r} />
      </div>

      {/* Recommendations */}
      <div className="mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 flex items-end justify-between"
        >
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">Recommendations</h2>
            <p className="mt-1 text-sm text-slate-400">Prioritized fixes ranked by impact</p>
          </div>
          {!isAllClear && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              {r.recommendations.length} suggestions
            </span>
          )}
        </motion.div>
        {isAllClear ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl glass p-10 text-center">
            <PartyPopper className="h-8 w-8 text-success" />
            <p className="text-sm text-slate-300">{NO_ISSUES_MESSAGE}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {r.recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
