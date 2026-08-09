import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { Upload, Sparkles, Play, Share2, MessageCircle } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload your moments',
    description: 'Photos, videos, voice notes, text — drop everything from your experience.',
    glowGradient: 'from-amber-500/40 via-orange-500/30 to-yellow-500/20',
    borderClass: 'border-white/10 group-hover:border-amber-400/60',
    cardShadow: 'group-hover:shadow-[0_0_35px_rgba(245,158,11,0.22)]',
    stepBadge: 'text-amber-400',
    titleHover: 'group-hover:text-amber-200',
    iconBorder: 'from-amber-500 to-orange-500',
    iconText: 'text-amber-400',
    innerGlow: 'from-amber-500/[0.07] to-transparent',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'AI understands',
    description: 'We connect your moments, identify people, and reconstruct the timeline.',
    glowGradient: 'from-violet-600/40 via-purple-600/30 to-indigo-600/20',
    borderClass: 'border-white/10 group-hover:border-violet-500/60',
    cardShadow: 'group-hover:shadow-[0_0_35px_rgba(139,92,246,0.22)]',
    stepBadge: 'text-violet-400',
    titleHover: 'group-hover:text-violet-200',
    iconBorder: 'from-violet-500 to-purple-500',
    iconText: 'text-violet-400',
    innerGlow: 'from-violet-500/[0.07] to-transparent',
  },
  {
    step: '03',
    icon: Play,
    title: 'Relive',
    description: 'Experience your memory as a cinematic story with AI narration.',
    glowGradient: 'from-cyan-500/40 via-sky-500/30 to-blue-600/20',
    borderClass: 'border-white/10 group-hover:border-cyan-400/60',
    cardShadow: 'group-hover:shadow-[0_0_35px_rgba(6,182,212,0.22)]',
    stepBadge: 'text-cyan-400',
    titleHover: 'group-hover:text-cyan-200',
    iconBorder: 'from-cyan-400 to-blue-500',
    iconText: 'text-cyan-400',
    innerGlow: 'from-cyan-500/[0.07] to-transparent',
  },
  {
    step: '04',
    icon: MessageCircle,
    title: 'Explore',
    description: 'Ask your memory anything. "What was the funniest moment?"',
    glowGradient: 'from-emerald-500/40 via-teal-500/30 to-cyan-600/20',
    borderClass: 'border-white/10 group-hover:border-emerald-400/60',
    cardShadow: 'group-hover:shadow-[0_0_35px_rgba(16,185,129,0.22)]',
    stepBadge: 'text-emerald-400',
    titleHover: 'group-hover:text-emerald-200',
    iconBorder: 'from-emerald-400 to-teal-500',
    iconText: 'text-emerald-400',
    innerGlow: 'from-emerald-500/[0.07] to-transparent',
  },
  {
    step: '05',
    icon: Share2,
    title: 'Share',
    description: 'Auto-generate reels, stories, and montages to share.',
    glowGradient: 'from-rose-500/40 via-pink-500/30 to-orange-500/20',
    borderClass: 'border-white/10 group-hover:border-rose-400/60',
    cardShadow: 'group-hover:shadow-[0_0_35px_rgba(244,63,94,0.22)]',
    stepBadge: 'text-rose-400',
    titleHover: 'group-hover:text-rose-200',
    iconBorder: 'from-rose-400 to-pink-500',
    iconText: 'text-rose-400',
    innerGlow: 'from-rose-500/[0.07] to-transparent',
  },
];

export default function HowItWorks() {
  const [ref, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={ref} id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-memory-ivory mb-4">
            How it works
          </h2>
          <p className="text-memory-ivory-muted text-base sm:text-lg max-w-xl mx-auto">
            Five steps from scattered moments to a memory you'll never forget.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting vertical gradient line */}
          <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-amber-500/40 via-violet-500/40 to-rose-500/40 hidden sm:block -translate-x-1/2" />

          <div className="space-y-10 sm:space-y-14">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isEven = i % 2 === 0;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }}
                  className={`flex items-center gap-6 md:gap-12 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content Card with Distinct Ambient Glow on Hover */}
                  <div className={`flex-1 relative group ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                    {/* Individual Ambient Aura Backlight */}
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${step.glowGradient} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                    />

                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={`relative p-6 sm:p-7 rounded-3xl bg-[#141416]/90 border ${step.borderClass} ${step.cardShadow} backdrop-blur-xl shadow-xl transition-all duration-300 overflow-hidden`}
                    >
                      {/* Subtle Inner Glow on Hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-b ${step.innerGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                      />

                      <div className="relative z-10">
                        <span className={`text-[11px] font-mono font-bold tracking-wider ${step.stepBadge} uppercase mb-1.5 inline-block`}>
                          STEP {step.step}
                        </span>
                        <h3 className={`font-display text-xl sm:text-2xl font-bold text-white mb-2 ${step.titleHover} transition-colors`}>
                          {step.title}
                        </h3>
                        <p className="text-white/60 text-sm leading-relaxed font-normal">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Icon with colored border and glowing aura */}
                  <div className="relative flex-shrink-0 z-10">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 4 }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.iconBorder} p-[1.5px] shadow-xl flex items-center justify-center`}
                    >
                      <div className="w-full h-full rounded-[14px] bg-[#0c0c0e]/90 backdrop-blur-sm flex items-center justify-center">
                        <Icon size={22} className={step.iconText} />
                      </div>
                    </motion.div>
                  </div>

                  {/* Spacer for alignment */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
