import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import type { PerformanceItem } from '../data/dummyData';
import { statusMeta } from '../utils/status';

export function PerformanceCard({ items, score }: { items: PerformanceItem[]; score: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Performance</h3>
          <p className="text-sm text-slate-400">Speed & asset breakdown</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <Gauge className="h-4 w-4 text-success" />
          <span className="font-display text-sm font-bold text-white">{score}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {items.map((it, i) => {
          const meta = statusMeta[it.status];
          return (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{it.label}</p>
                {it.sub && <p className="text-xs text-slate-500">{it.sub}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-white">{it.value}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.color} ring-1 ${meta.ring}`}>
                  {meta.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
