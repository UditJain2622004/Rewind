import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Compass, Share2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function ThreeModes() {
  const [ref, isVisible] = useScrollAnimation(0.2);
  const [hoveredMode, setHoveredMode] = useState(null);

  const modes = [
    {
      id: 'relive',
      title: 'Relive',
      icon: Play,
      badge: 'Cinematic Replay',
      glowColor: 'from-violet-600/40 via-purple-600/30 to-indigo-600/20',
      borderClass: 'border-white/10 group-hover:border-violet-500/60',
      cardHoverGlow: 'group-hover:shadow-[0_0_40px_rgba(139,92,246,0.25)]',
      iconBg: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
      titleHover: 'group-hover:text-violet-200',
      innerGradient: 'from-violet-500/[0.08] to-transparent',
      description: 'A cinematic story told through your eyes, narrated by AI with orchestral emotion.',
      link: '/relive/goa-july-2026',
    },
    {
      id: 'explore',
      title: 'Explore',
      icon: Compass,
      badge: 'Conversational AI',
      glowColor: 'from-emerald-500/40 via-teal-500/30 to-cyan-500/20',
      borderClass: 'border-white/10 group-hover:border-emerald-400/60',
      cardHoverGlow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.25)]',
      iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      titleHover: 'group-hover:text-emerald-200',
      innerGradient: 'from-emerald-500/[0.08] to-transparent',
      description: 'Ask your memories anything. Search for that specific sunset or a funny quote.',
      link: '/explore/goa-july-2026',
    },
    {
      id: 'share',
      title: 'Share',
      icon: Share2,
      badge: 'Reel Export',
      glowColor: 'from-amber-500/40 via-orange-500/30 to-rose-500/20',
      borderClass: 'border-white/10 group-hover:border-amber-400/60',
      cardHoverGlow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.25)]',
      iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      titleHover: 'group-hover:text-amber-200',
      innerGradient: 'from-amber-500/[0.08] to-transparent',
      description: 'Automatically generated reels and stories ready for the world to see.',
      link: '/share/goa-july-2026',
    },
  ];

  return (
    <section ref={ref} className="py-24 sm:py-32 px-4 sm:px-6 bg-[#0a0a0b] text-center border-t border-white/[0.05] relative overflow-hidden">
      {/* Dynamic Background Ambient Liquid Glow that changes per hovered card */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[150px] pointer-events-none transition-all duration-700 ${
          hoveredMode === 'relive'
            ? 'bg-violet-600/20 scale-110'
            : hoveredMode === 'explore'
            ? 'bg-emerald-500/20 scale-110'
            : hoveredMode === 'share'
            ? 'bg-amber-500/20 scale-110'
            : 'bg-purple-600/10'
        }`}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Badge Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-white/90 text-xs font-semibold tracking-widest uppercase mb-12 sm:mb-16 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span>ONE EXPERIENCE. THREE MODES.</span>
        </motion.div>

        {/* 3 Interactive Cards with Distinct Individual Colors */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.title}
                className="relative group"
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
              >
                {/* Individual Ambient Backlight Aura Glow */}
                <div
                  className={`absolute -inset-1 bg-gradient-to-r ${mode.glowColor} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`relative rounded-3xl bg-[#141416]/90 border ${mode.borderClass} ${mode.cardHoverGlow} p-6 sm:p-8 backdrop-blur-xl shadow-xl transition-all duration-400 flex flex-col justify-between h-full overflow-hidden`}
                >
                  {/* Subtle Inner Glow on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${mode.innerGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none`}
                  />

                  {/* Card Header */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl ${mode.iconBg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={22} />
                      </div>
                      <span className="text-[11px] font-medium text-white/60 px-3 py-1 rounded-full bg-white/[0.04] border border-white/5">
                        {mode.badge}
                      </span>
                    </div>

                    <h3 className={`font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 ${mode.titleHover} transition-colors`}>
                      {mode.title}
                    </h3>

                    <p className="text-white/60 text-sm leading-relaxed font-normal">
                      {mode.description}
                    </p>
                  </div>

                  {/* Card CTA Link */}
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-white/70 group-hover:text-white transition-colors relative z-10">
                    <Link to={mode.link} className="flex items-center gap-1.5 hover:underline">
                      <span>Try {mode.title} Mode</span>
                      <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
