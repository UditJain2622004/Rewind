import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

export default function WhyThisMoment({ moment }) {
  const [open, setOpen] = useState(false);

  const reasons = [
    moment.voiceNote && `${moment.people?.[0] || 'Someone'} mentioned this moment in a voice note`,
    moment.photos?.length > 1 && `${moment.photos.length} photos were captured around the same time`,
    moment.people?.length > 2 && `${moment.people.length} people were present at this moment`,
    'AI detected a shift in the emotional tone of the trip around this point',
  ].filter(Boolean);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm text-memory-ivory-muted hover:text-memory-ivory transition-colors"
      >
        <HelpCircle size={14} />
        Why this moment?
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-memory-ivory">
                  Why this moment?
                </h3>
                <button onClick={() => setOpen(false)} className="text-memory-ivory-muted hover:text-memory-ivory">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {reasons.map((reason, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-memory-lavender mt-2 flex-shrink-0" />
                    <p className="text-sm text-memory-ivory-muted leading-relaxed">{reason}</p>
                  </motion.div>
                ))}
              </div>

              <p className="mt-4 text-xs text-memory-ivory-muted/50 italic">
                Rewind AI uses voice notes, photo timestamps, and context to understand why moments matter.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
