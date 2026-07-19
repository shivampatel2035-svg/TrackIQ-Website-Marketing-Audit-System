import { motion } from 'framer-motion';

export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark [background-size:64px_64px] opacity-[0.35] mask-fade-b" />
      <motion.div
        className="absolute -top-40 left-1/4 h-[36rem] w-[36rem] rounded-full bg-brand-500/20 blur-[120px]"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 h-[32rem] w-[32rem] rounded-full bg-accent-500/20 blur-[120px]"
        animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-success/10 blur-[120px]"
        animate={{ x: [0, 20, -40, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
