import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <motion.div
        whileHover={{ rotate: 8, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className={`relative ${dim} rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 grid place-items-center shadow-glow`}
      >
        <Radar className="h-1/2 w-1/2 text-white" />
        <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </motion.div>
      <span className={`font-display font-bold tracking-tight ${text} text-white`}>
        Track<span className="text-brand-400">IQ</span>
      </span>
    </Link>
  );
}
