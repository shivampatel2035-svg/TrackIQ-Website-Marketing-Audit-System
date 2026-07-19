import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Radar, RefreshCw, AlertTriangle } from 'lucide-react';
import { loadingSteps } from '../data/dummyData';
import { Logo } from '../components/Logo';
import { useScan } from '../context/ScanContext';

export function LoadingScreen() {
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { status, error, runScan } = useScan();
  const url = params.get('url') || '';
  const scanKeyRef = useRef<string | null>(null);

  // Kick off the real scan exactly once per url (guarded against
  // StrictMode's dev-mode double-invoke of effects, which would
  // otherwise fire two overlapping requests for the same scan).
  useEffect(() => {
    if (!url) {
      navigate('/');
      return;
    }
    if (scanKeyRef.current === url) return;
    scanKeyRef.current = url;
    runScan(url);
  }, [url, navigate, runScan]);

  // The backend runs the full audit (Modules 1-6) in a single call and
  // doesn't report per-step progress, so this keeps the existing step
  // list gently advancing while the request is in flight - it reflects
  // "still working", not literal per-step completion.
  useEffect(() => {
    if (status !== 'loading') return;
    if (active >= loadingSteps.length) return;
    const t = setTimeout(() => setActive((a) => Math.min(a + 1, loadingSteps.length)), 900);
    return () => clearTimeout(t);
  }, [status, active]);

  // Once the real result comes back, finish the step list and move on.
  useEffect(() => {
    if (status === 'success') {
      setActive(loadingSteps.length);
      setDone(true);
      const t = setTimeout(() => navigate('/dashboard'), 700);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  const handleRetry = () => {
    setActive(0);
    setDone(false);
    runScan(url);
  };

  const progress = (active / loadingSteps.length) * 100;

  return (
    <div className="relative grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mx-auto mb-8 grid h-20 w-20 place-items-center rounded-3xl shadow-glow ${
            status === 'error' ? 'bg-danger/20' : 'bg-gradient-to-br from-brand-500 to-accent-600'
          }`}
        >
          {status === 'error' ? (
            <AlertTriangle className="h-10 w-10 text-danger" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Radar className="h-10 w-10 text-white" />
            </motion.div>
          )}
        </motion.div>

        <Logo size="lg" />
        <p className="mt-3 text-sm text-slate-400">
          Auditing <span className="font-medium text-white">{url}</span>
        </p>

        <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${
              status === 'error' ? 'from-danger to-danger' : 'from-brand-500 to-accent-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {status === 'error' ? 'Scan interrupted' : `${Math.round(progress)}% complete`}
        </p>

        <div className="mt-8 space-y-2.5 text-left">
          {loadingSteps.map((step, i) => {
            const state = i < active ? 'done' : i === active ? 'active' : 'pending';
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5"
              >
                {state === 'done' && <CheckCircle2 className="h-5 w-5 text-success" />}
                {state === 'active' && status === 'loading' && (
                  <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
                )}
                {state === 'active' && status === 'error' && (
                  <AlertTriangle className="h-5 w-5 text-danger" />
                )}
                {state === 'pending' && <div className="h-5 w-5 rounded-full border border-white/10" />}
                <span className={`text-sm ${state === 'pending' ? 'text-slate-500' : 'text-white'}`}>
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {done && status === 'success' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-sm font-medium text-success"
            >
              Audit complete — loading report…
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass mt-6 rounded-2xl border border-danger/30 p-5 text-left"
            >
              <p className="text-sm font-medium text-danger">Scan failed</p>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button onClick={handleRetry} className="btn-primary text-sm">
                  <RefreshCw className="h-4 w-4" /> Try Again
                </button>
                <button onClick={() => navigate('/')} className="btn-ghost text-sm">
                  Back to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
