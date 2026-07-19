import { motion } from 'framer-motion';
import { howItWorks } from '../data/dummyData';

export function HowItWorks() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-400">How it works</p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          From URL to report in three steps
        </h2>
      </motion.div>

      <div className="relative mt-14 grid gap-6 md:grid-cols-3">
        <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent md:block" />
        {howItWorks.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className="relative rounded-2xl glass p-7 text-center"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 font-display text-xl font-bold text-white shadow-glow">
              {s.step}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
