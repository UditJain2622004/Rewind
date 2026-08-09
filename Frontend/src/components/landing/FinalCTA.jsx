import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import MagneticButton from '../shared/MagneticButton';
import ParticleEffect from '../shared/ParticleEffect';

export default function FinalCTA() {
  const [ref, isVisible] = useScrollAnimation(0.2);

  return (
    <section ref={ref} className="relative py-32 sm:py-44 px-4 sm:px-6 overflow-hidden bg-[#0a0a0b] border-t border-white/[0.04]">
      <ParticleEffect count={45} />

      {/* Pulsing Gradient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      {/* Floating Polaroid Cards around CTA */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [-6, -4, -6] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="hidden md:block absolute left-8 lg:left-20 top-1/3 w-36 h-48 rounded-2xl overflow-hidden bg-[#141416] p-2 border border-white/10 shadow-2xl pointer-events-none opacity-40 hover:opacity-80 transition-opacity"
      >
        <img src="/images/beach-moment.png" alt="Memory" className="w-full h-32 object-cover rounded-xl" />
        <p className="text-[10px] text-white/70 font-mono mt-2 text-center">Baga Beach • 09:42</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0], rotate: [6, 4, 6] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
        className="hidden md:block absolute right-8 lg:right-20 top-1/3 w-36 h-48 rounded-2xl overflow-hidden bg-[#141416] p-2 border border-white/10 shadow-2xl pointer-events-none opacity-40 hover:opacity-80 transition-opacity"
      >
        <img src="/images/dusk-mountains.png" alt="Memory" className="w-full h-32 object-cover rounded-xl" />
        <p className="text-[10px] text-white/70 font-mono mt-2 text-center">Twilight Pass • 18:30</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.12]">
          Your first memory<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-indigo-300">
            is waiting to be built.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-white/70 mb-10 max-w-lg mx-auto font-normal leading-relaxed">
          Stop scrolling through thousands of scattered photos. Start reliving the moments that truly mattered with Rewind.
        </p>

        <Link to="/create">
          <MagneticButton className="px-10 py-5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-bold text-base sm:text-lg flex items-center gap-3 shadow-2xl shadow-purple-600/40 hover:shadow-purple-600/60 hover:scale-105 active:scale-95 transition-all mx-auto group">
            <span>Create your first Memory</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
        </Link>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-8 text-xs sm:text-sm text-white/40 font-normal"
        >
          Instant AI generation • Private & secure • Built for your stories
        </motion.p>
      </motion.div>
    </section>
  );
}
