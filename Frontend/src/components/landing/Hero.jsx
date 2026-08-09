import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import HeroTimeline from './HeroTimeline';

const topRowPhotos = [
  { src: '/images/goa-cover.png', alt: 'Sunset on beach' },
  { src: '/images/dinner-moment.png', alt: 'Friends laughing over dinner' },
  { src: '/images/dusk-mountains.png', alt: 'Mountains at twilight' },
  { src: '/images/vintage-camera.png', alt: 'Vintage camera lens' },
];

const bottomRowPhotos = [
  { src: '/images/road-trip.png', alt: 'Forest walk' },
  { src: '/images/birthday-cover.png', alt: 'Lantern street' },
  { src: '/images/beach-moment.png', alt: 'Beach moment polaroid' },
  { src: '/images/hidden-beach.png', alt: 'Friends on beach' },
  { src: '/images/wedding-cover.png', alt: 'Celebration dusk' },
];

const row1Photos = [...topRowPhotos, ...topRowPhotos, ...topRowPhotos, ...topRowPhotos];
const row2Photos = [...bottomRowPhotos, ...bottomRowPhotos, ...bottomRowPhotos, ...bottomRowPhotos];

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0a0a0b] overflow-hidden flex flex-col items-center justify-center pt-28 sm:pt-36 pb-16">
      {/* Background Animated Sliding Photo Reels */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center gap-4 sm:gap-6 pointer-events-none opacity-85 select-none overflow-hidden">
        {/* Top Row — Continuously slides left */}
        <div className="flex overflow-hidden w-full">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 32 }}
            className="flex gap-4 sm:gap-6 shrink-0"
          >
            {row1Photos.map((photo, i) => (
              <div
                key={`r1-${i}`}
                className="relative w-64 sm:w-80 h-40 sm:h-52 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#141416] border border-white/20 shadow-xl shrink-0"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.05] hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Row — Continuously slides right */}
        <div className="flex overflow-hidden w-full">
          <motion.div
            animate={{ x: ['-50%', '0%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 38 }}
            className="flex gap-4 sm:gap-6 shrink-0"
          >
            {row2Photos.map((photo, i) => (
              <div
                key={`r2-${i}`}
                className="relative w-60 sm:w-72 h-40 sm:h-52 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#141416] border border-white/20 shadow-xl shrink-0"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.05] hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Global dark radial vignette overlay to make center text pop while keeping background images visible */}
      <div className="absolute inset-0 z-10 bg-radial from-[#0a0a0b]/10 via-[#0a0a0b]/40 to-[#0a0a0b]/80 pointer-events-none" />

      {/* Ambient Pulsing & Morphing Liquid Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none animate-liquid-morph animate-caustics" />
      <div className="absolute bottom-1/3 left-1/4 w-[350px] h-[300px] bg-amber-500/10 rounded-full blur-[110px] pointer-events-none animate-liquid-morph" />

      {/* Center Hero Content Container */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.12] mb-5 sm:mb-6"
        >
          Your memories deserve<br />
          more than a <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-purple-200">camera roll.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm sm:text-lg text-white/70 max-w-xl mx-auto font-normal leading-relaxed mb-8 sm:mb-10"
        >
          Turn photos, videos, and the stories you tell into memories you can relive, explore, and share.
        </motion.p>

        {/* Action Buttons with Interactive Magnetic Motion */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12"
        >
          <Link
            to="/create"
            className="group relative px-7 py-3.5 rounded-full bg-[#f5f0e8] text-[#0a0a0b] font-semibold text-sm sm:text-base flex items-center gap-2 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            <span>Create a Memory</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#how-it-works"
            className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm sm:text-base flex items-center gap-2 backdrop-blur-md hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <Play size={14} className="fill-white text-white" />
            <span>See how it works</span>
          </a>
        </motion.div>

        {/* Floating Mini Timeline Card */}
        <HeroTimeline />
      </div>

      {/* Undulating Liquid Water Wave Horizon Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none opacity-40">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[200%] h-12 text-[#141416] animate-water-wave"
          fill="currentColor"
        >
          <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" opacity="0.4" />
          <path d="M0,20 C200,100 450,10 700,60 C950,110 1100,30 1200,50 L1200,120 L0,120 Z" opacity="0.7" />
        </svg>
      </div>
    </section>
  );
}
