import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { TrackingTool } from '../data/dummyData';
import { statusMeta } from '../utils/status';

export function TrackingCard({ tools, score }: { tools: TrackingTool[]; score: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl glass p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Tracking</h3>
          <p className="text-sm text-slate-400">Analytics & marketing tags</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <Icons.Radar className="h-4 w-4 text-brand-400" />
          <span className="font-display text-sm font-bold text-white">{score}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {tools.map((t, i) => {
          const Icon = (Icons as any)[t.icon] ?? Icons.Tags;
          const meta = statusMeta[t.status];
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-white/10 hover:bg-white/5"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${meta.bg} ring-1 ${meta.ring}`}>
                <Icon className={`h-5 w-5 ${meta.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                {t.status !== 'missing' && (
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={`h-full rounded-full ${meta.color.replace('text-', 'bg-')}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${t.score}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.8 }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
