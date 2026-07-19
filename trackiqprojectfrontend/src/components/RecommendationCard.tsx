import { motion } from 'framer-motion';
import { Lightbulb, ArrowUpRight } from 'lucide-react';
import type { Recommendation } from '../data/dummyData';
import { impactMeta } from '../utils/status';

const accentFor: Record<Recommendation['category'], string> = {
  Tracking: 'before:bg-brand-500',
  SEO: 'before:bg-accent-500',
  Performance: 'before:bg-success',
  Conversion: 'before:bg-warning',
};

export function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const impact = impactMeta[rec.impact];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-2xl glass p-5 before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${accentFor[rec.category]} transition-shadow hover:shadow-glow`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 ring-1 ring-white/10">
            <Lightbulb className="h-5 w-5 text-brand-300" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
            <span className="text-xs text-slate-500">{rec.category}</span>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${impact.bg} ${impact.color}`}>
          {rec.impact} impact
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{rec.description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-300 opacity-0 transition group-hover:opacity-100">
        Learn how to fix <ArrowUpRight className="h-3 w-3" />
      </div>
    </motion.div>
  );
}
