import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Wand2, Compass } from 'lucide-react';
import ParticleEffect from '../shared/ParticleEffect';
import { aiProcessingSteps } from '../../data/mockData';

export default function AIProcessingAnimation({ memoryName = 'Goa Road Trip' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(15);
  const [complete, setComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 450);

    const timers = aiProcessingSteps.map((step, i) =>
      setTimeout(() => setCurrentStep(i + 1), step.delay)
    );

    const completeTimer = setTimeout(() => {
      setProgress(100);
      setComplete(true);
    }, 4200);

    const redirectTimer = setTimeout(() => navigate('/memory/goa-july-2026'), 5200);

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#0a0a0b] flex items-center justify-center overflow-hidden"
    >
      <ParticleEffect count={60} />

      {/* Ambient background pulsing aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md w-full mx-auto px-6">
        {/* Futuristic Gyroscope Core */}
        <div className="relative w-36 h-36 mx-auto mb-8 flex items-center justify-center">
          {/* Outer rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/40"
          />

          {/* Middle counter-rotating ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border-2 border-dotted border-amber-400/50"
          />

          {/* Central glowing core */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              boxShadow: [
                '0 0 30px rgba(124, 58, 237, 0.4)',
                '0 0 60px rgba(167, 139, 250, 0.7)',
                '0 0 30px rgba(124, 58, 237, 0.4)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-2xl"
          >
            <Sparkles size={28} className="text-white animate-spin" style={{ animationDuration: '6s' }} />
          </motion.div>
        </div>

        {/* Memory Name & Header */}
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
          {memoryName || 'Your Memory Story'}
        </h2>
        <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-6">
          REWIND AI ENGINE PROCESSING
        </p>

        {/* Live Progress Bar */}
        <div className="w-full bg-[#141416] border border-white/10 rounded-full h-2.5 mb-6 overflow-hidden p-0.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-400 to-amber-400"
            style={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>

        {/* Processing Steps List */}
        <div className="space-y-2.5 text-left max-w-sm mx-auto bg-[#141416]/70 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <AnimatePresence>
            {aiProcessingSteps.slice(0, Math.max(currentStep, 1)).map((step, i) => {
              const isDone = i < currentStep - 1 || complete;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 text-xs"
                >
                  {isDone ? (
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <motion.div
                      animate={{ scale: [0.8, 1.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-3.5 h-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin shrink-0"
                    />
                  )}
                  <span className={isDone ? 'text-white/90 font-medium' : 'text-violet-300 font-medium'}>
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Completion Message */}
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
            >
              <CheckCircle2 size={14} />
              <span>Story Compiled! Redirecting to Cinema Replay...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
