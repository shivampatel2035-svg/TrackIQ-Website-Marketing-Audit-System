import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, CircleDashed } from 'lucide-react';
import type { SeoItem } from '../data/dummyData';
import { statusMeta } from '../utils/status';

const iconFor = (status: SeoItem['status']) => {
  if (status === 'passed') return CheckCircle2;
  if (status === 'warning') return AlertTriangle;
  if (status === 'failed') return XCircle;
  return CircleDashed;
};

export function SeoCard({ items, score }: { items: SeoItem[]; score: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">SEO</h3>
          <p className="text-sm text-slate-400">On-page & discoverability</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <span className="font-display text-sm font-bold text-white">{score}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {items.map((it, i) => {
          const Icon = iconFor(it.status);
          const meta = statusMeta[it.status];
          return (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.color}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{it.label}</p>
                <p className="truncate text-xs text-slate-500">{it.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
