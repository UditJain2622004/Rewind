import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, List, X, Volume2 } from 'lucide-react';
import WhyThisMoment from './WhyThisMoment';

export default function StoryPlayer({ moments, memoryTitle }) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMoments, setShowMoments] = useState(false);
  const [direction, setDirection] = useState(1);
  const audioRef = useRef(null);

  const moment = moments[current];

  // ─── Auto-advance on audio end ───────────────────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const handleEnd = () => {
      if (current < moments.length - 1) {
        goTo(current + 1);
      } else {
        setIsPlaying(false);
      }
    };

    el.addEventListener('ended', handleEnd);
    return () => el.removeEventListener('ended', handleEnd);
  }, [current, moments.length]);

  // ─── Play / pause audio when isPlaying toggles ───────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !moment.audioUrl) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, current]);

  // ─── Load and auto-play when segment changes ─────────────────────────────
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !moment.audioUrl) return;
    el.load();
    if (isPlaying) el.play().catch(() => {});
  }, [current]);

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    setShowMoments(false);
  };

  const next = () => { if (current < moments.length - 1) goTo(current + 1); };
  const prev = () => { if (current > 0) goTo(current - 1); };

  return (
    <div className="fixed inset-0 bg-memory-base">

      {/* Hidden audio element */}
      {moment.audioUrl && (
        <audio ref={audioRef} src={moment.audioUrl} preload="auto" />
      )}

      {/* Photo background */}
      <motion.div
        key={moment.id}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
      >
        {moment.photos?.[0] ? (
          <img
            src={moment.photos[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/60 via-purple-900/40 to-indigo-900/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
      </motion.div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between">
        <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-lg">{moment.emoji}</span>
          <div>
            <p className="text-xs text-white/60">{moment.time}</p>
            <p className="text-sm text-white font-medium">{moment.location}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live audio indicator */}
          {moment.audioUrl && isPlaying && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs text-emerald-300"
            >
              <Volume2 size={12} />
              <span>Live narration</span>
            </motion.div>
          )}
          <WhyThisMoment moment={moment} />
        </div>
      </div>

      {/* AI narration text */}
      <motion.div
        key={`narration-${moment.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-32 sm:bottom-40 left-0 right-0 px-6 sm:px-16 z-10"
      >
        <div className="max-w-3xl mx-auto">
          <p className="font-display text-xl sm:text-2xl md:text-3xl text-white/90 leading-relaxed font-light italic text-center">
            "{moment.aiNarration}"
          </p>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 z-20 px-6 sm:px-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-1">
            {moments.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 cursor-pointer"
              >
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={false}
                  animate={{ width: i <= current ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-20">
        <div className="flex items-center justify-center gap-6">
          <button onClick={prev} disabled={current === 0} className="text-white/60 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={28} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          <button onClick={next} disabled={current === moments.length - 1} className="text-white/60 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight size={28} />
          </button>

          <button
            onClick={() => setShowMoments(!showMoments)}
            className="text-white/60 hover:text-white transition-colors ml-4"
          >
            <List size={22} />
          </button>
        </div>
      </div>

      {/* Moments list overlay */}
      {showMoments && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="absolute top-0 right-0 bottom-0 w-80 z-30 glass-strong border-l border-white/8 overflow-y-auto"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">Moments</h3>
              <button onClick={() => setShowMoments(false)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {moments.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => goTo(i)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    i === current ? 'bg-memory-violet/20 border border-memory-lavender/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{m.emoji}</span>
                    <div>
                      <p className="text-sm text-white line-clamp-1">{m.description}</p>
                      <p className="text-xs text-white/50">{m.time} • {m.location}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
