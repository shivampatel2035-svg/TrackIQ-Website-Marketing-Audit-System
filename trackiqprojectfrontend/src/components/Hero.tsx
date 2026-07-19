import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

export function Hero() {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = url.trim().replace(/^https?:\/\//, '');
    if (!clean) return; // require a real URL - no more silent fallback to a fake domain
    navigate(`/scan?url=${encodeURIComponent(clean)}`);
  };

  return (
    <section className="relative mx-auto max-w-7xl px-5 pt-36 pb-20 lg:px-8 lg:pt-44">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          AI-powered marketing audits · now in beta
          <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-brand-300">v2.4</span>
        </motion.div>

        <h1 className="mt-7 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Analyze Any Website Like a{' '}
          <span className="relative">
            <span className="text-gradient">Marketing Expert</span>
            <motion.span
              className="absolute -bottom-1 left-0 h-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          TrackIQ analyzes Tracking, SEO, Performance and generates a complete marketing report
          in seconds.
        </p>

        <form onSubmit={submit} className="mx-auto mt-9 max-w-xl">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-700/70 p-2 backdrop-blur-xl shadow-card focus-within:border-brand-500/50 focus-within:shadow-glow"
          >
            <div className="pl-3 text-slate-500">
              <Zap className="h-5 w-5" />
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a website URL, e.g. acme.io"
              required
              className="flex-1 bg-transparent px-1 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="btn-primary !rounded-xl !px-5 !py-2.5 text-sm"
            >
              Scan Website
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
          <p className="mt-3 text-xs text-slate-500">
            No signup required · Free for your first 10 audits
          </p>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="relative mx-auto mt-16 max-w-5xl"
      >
        <div className="gradient-border rounded-2xl p-1.5 shadow-glow">
          <div className="rounded-xl bg-ink-800/80 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-danger/80" />
              <span className="h-3 w-3 rounded-full bg-warning/80" />
              <span className="h-3 w-3 rounded-full bg-success/80" />
              <span className="ml-3 text-xs text-slate-500">trackiq.app/report/acme.io</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Overall Score', value: 78, color: 'from-brand-500 to-accent-500' },
                { label: 'Tracking', value: 72, color: 'from-accent-500 to-brand-500' },
                { label: 'SEO', value: 84, color: 'from-success to-brand-500' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="font-display text-3xl font-bold text-white">{s.value}</span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.value}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.9 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
