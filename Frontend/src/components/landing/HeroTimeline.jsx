import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const timelineItems = [
  { time: '09:42 AM', emoji: '☀️', text: 'We started the day at Baga Beach' },
  { time: '02:17 PM', emoji: '🗺️', text: 'Accidentally discovered a hidden beach' },
  { time: '08:43 PM', emoji: '🥂', text: 'The restaurant nobody planned to visit' },
];

export default function HeroTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="w-full max-w-md mx-auto rounded-2xl bg-[#141416]/75 backdrop-blur-xl border border-white/10 p-5 shadow-2xl text-left"
    >
      {/* Top Header: Title + Sparkle */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
          <span className="text-[11px] tracking-wider uppercase text-white/70 font-semibold">
            GOA • JULY 2026
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-medium border border-purple-500/30">
          <Sparkles size={11} className="text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Live Timeline</span>
        </div>
      </div>

      {/* Timeline items */}
      <div className="space-y-2.5">
        {timelineItems.map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 text-xs sm:text-sm p-2 rounded-xl border border-transparent hover:border-white/5 transition-all cursor-default"
          >
            <span className="text-white/40 font-mono text-[11px] w-14 shrink-0 font-medium">
              {item.time}
            </span>
            <div className="flex items-center gap-2 text-white/90 font-normal truncate">
              <span className="text-base">{item.emoji}</span>
              <span className="truncate">{item.text}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Card Footer Tagline */}
      <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between">
        <p className="text-[10px] tracking-widest uppercase text-white/40 font-medium">
          POWERED BY REWIND AI
        </p>
        <span className="text-[10px] text-violet-400/80 font-mono">3 / 47 Moments</span>
      </div>
    </motion.div>
  );
}
