import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CinematicSlide({ moment, direction = 1 }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={moment.id}
        initial={{ opacity: 0, x: direction * 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -direction * 100 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute inset-0"
      >
        {/* Photo background */}
        <img
          src={moment.photos?.[0] || '/images/goa-cover.png'}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Location & time badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-8 left-8 sm:top-12 sm:left-12"
        >
          <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-lg">{moment.emoji}</span>
            <div>
              <p className="text-xs text-memory-ivory-muted">{moment.time}</p>
              <p className="text-sm text-memory-ivory font-medium">{moment.location}</p>
            </div>
          </div>
        </motion.div>

        {/* AI narration */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="absolute bottom-24 sm:bottom-32 left-0 right-0 px-8 sm:px-16 max-w-3xl mx-auto"
        >
          <p className="font-display text-xl sm:text-2xl md:text-3xl text-white leading-relaxed font-light italic">
            "{moment.aiNarration}"
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
