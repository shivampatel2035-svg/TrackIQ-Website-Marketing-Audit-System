import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { features } from '../data/dummyData';

export function FeatureCards() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Features</p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Everything you need to audit a website
        </h2>
        <p className="mt-4 text-slate-400">
          A complete marketing intelligence stack — tracking, SEO, performance and AI recommendations in one report.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = (Icons as any)[f.icon] ?? Icons.Sparkles;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl glass p-6 transition-shadow hover:shadow-glow"
            >
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${f.accent} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
              <div className={`relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.accent} shadow-glow`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="relative mt-5 text-lg font-semibold text-white">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{f.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
