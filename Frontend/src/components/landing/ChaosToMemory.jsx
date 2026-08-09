import { motion } from 'framer-motion';
import { Camera, Mic, Play, FileText } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function ChaosToMemory() {
  const [ref, isVisible] = useScrollAnimation(0.15);

  return (
    <section ref={ref} className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0b] relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading, Subtext, Badges card with connecting lines */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              From Chaos to Memory
            </h2>

            <p className="text-white/65 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              Your life is scattered across apps, chats, and clouds. Rewind gathers the pieces—photos, voice notes, videos, and texts—and weaves them into a single, beautiful story.
            </p>

            {/* Media Badges Container with connecting lines */}
            <div className="relative rounded-3xl bg-[#141416]/80 border border-white/10 p-6 sm:p-8 overflow-hidden backdrop-blur-md shadow-2xl">
              {/* Subtle background glow */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Grid of 4 media badges */}
              <div className="grid grid-cols-2 gap-3.5 relative z-10">
                {/* 43 Photos */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-purple-500/30 transition-all shadow-sm cursor-default group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Camera size={16} />
                  </div>
                  <span className="text-sm font-medium text-white/90">43 Photos</span>
                </motion.div>

                {/* 12 Videos */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-purple-500/30 transition-all shadow-sm cursor-default group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Play size={15} className="fill-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-white/90">12 Videos</span>
                </motion.div>

                {/* 6 Voice Notes */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-purple-500/30 transition-all shadow-sm cursor-default group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Mic size={16} />
                  </div>
                  <span className="text-sm font-medium text-white/90">6 Voice Notes</span>
                </motion.div>

                {/* Text Snippets */}
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-purple-500/30 transition-all shadow-sm cursor-default group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={16} />
                  </div>
                  <span className="text-sm font-medium text-white/90">Text Snippets</span>
                </motion.div>
              </div>

              {/* Animated connecting lines in the lower area */}
              <div className="relative h-14 mt-4 w-full">
                <svg className="w-full h-full stroke-purple-400/40" fill="none" viewBox="0 0 400 50">
                  <path d="M 60 5 Q 160 45 340 45" strokeWidth="2" strokeDasharray="6 6" className="animate-pulse" />
                  <path d="M 260 5 Q 290 30 360 45" strokeWidth="2" strokeDasharray="6 6" className="animate-pulse" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Large GOA Showcase Card with interactive hover and sound-wave badge */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ y: -6 }}
            className="relative"
          >
            {/* Ambient Water Caustics Backlight Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-purple-600/25 to-sky-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity animate-caustics pointer-events-none" />

            <div className="relative w-full aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden border border-white/10 bg-[#141416] shadow-2xl group liquid-card">
              {/* Warm Bokeh Lights Resort Image */}
              <img
                src="/images/dinner-moment.png"
                alt="Goa Memory Showcase"
                className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.1] scale-105 group-hover:scale-110 transition-transform duration-700"
              />

              {/* Dark subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Floating Top Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-amber-300">
                  Rewind Memory
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] text-white/80 font-mono">
                  4K HDR
                </span>
              </div>

              {/* Giant Serif "G O A" text in warm amber-orange */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="font-display font-bold text-6xl sm:text-8xl md:text-9xl tracking-[0.25em] pl-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-[#fb923c] via-[#f97316] to-[#ea580c] drop-shadow-2xl opacity-95">
                  GOA
                </span>
              </div>

              {/* Bottom Audio Wave / Timeline Bar */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs text-white/90 font-medium">Original Voice Audio Synced</span>
                </div>
                <div className="flex items-end gap-1 h-3.5">
                  {[40, 90, 60, 100, 50, 80, 30].map((h, idx) => (
                    <motion.span
                      key={idx}
                      animate={{ height: ['30%', `${h}%`, '30%'] }}
                      transition={{ repeat: Infinity, duration: 0.8 + idx * 0.1, ease: 'easeInOut' }}
                      className="w-1 bg-amber-400/90 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
