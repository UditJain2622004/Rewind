import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Sparkles, Compass, Users, Clock, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { memories as allMemories } from '../../data/mockData';

export default function FeaturedMemory({ memory, items }) {
  const candidateItems = (items && items.length > 0)
    ? items
    : (memory ? [memory] : (allMemories && allMemories.length > 0 ? allMemories : []));

  const slides = candidateItems.filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Reset index if slides shrink/change
  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Auto-slide every 5 seconds when not hovered
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = slides.length - 1;
      if (next >= slides.length) next = 0;
      return next;
    });
  };

  const currentMemory = slides[currentIndex] || slides[0];

  if (!currentMemory) {
    return (
      <div className="relative group select-none">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-violet-600/30 to-indigo-600/20 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
        <div className="relative aspect-[16/11] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 bg-[#141416] p-8 flex flex-col justify-center items-center text-center">
          <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-4">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">No Memories Featured Yet</h2>
          <p className="text-white/60 text-sm max-w-md mb-6">Create your first memory story to relive your favorite moments in cinematic detail.</p>
          <Link
            to="/create"
            className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all shadow-lg"
          >
            Create Memory
          </Link>
        </div>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 260, damping: 28 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 260, damping: 28 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  return (
    <div
      className="relative group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient Glowing Backlight */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-violet-600/30 to-indigo-600/20 rounded-3xl blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />

      <div className="relative aspect-[16/11] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 bg-[#141416] shadow-2xl">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full"
          >
            {/* Cover image with smooth cinematic zoom */}
            <img
              src={currentMemory.cover || '/images/goa-cover.png'}
              alt={currentMemory.title || 'Featured Memory'}
              className="absolute inset-0 w-full h-full object-cover filter brightness-[0.8] contrast-[1.05]"
            />

            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium">
                  Featured ({currentIndex + 1}/{slides.length})
                </span>
                {currentMemory.subtitle && (
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/60 text-xs font-mono">
                    {currentMemory.subtitle}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
                    {currentMemory.fullTitle || currentMemory.title || 'Featured Story'}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 mt-2">
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      {currentMemory.stats?.people ?? 0} people
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {currentMemory.stats?.days ?? 0} days
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="flex items-center gap-1">
                      <ImageIcon size={13} />
                      {currentMemory.stats?.moments ?? 0} moments
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/relive/${currentMemory.id}`}
                    className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-neutral-200 transition-all"
                  >
                    <Play size={13} className="fill-black text-black" />
                    <span>Relive</span>
                  </Link>

                  <Link
                    to={`/explore/${currentMemory.id}`}
                    className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-xs flex items-center gap-1.5 backdrop-blur-md transition-all"
                  >
                    <Compass size={13} />
                    <span>Explore</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              aria-label="Previous Slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => paginate(1)}
              aria-label="Next Slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 border border-white/15 text-white flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Pagination Progress Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1);
                  setCurrentIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
