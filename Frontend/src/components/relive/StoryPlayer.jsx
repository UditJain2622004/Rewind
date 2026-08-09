import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, List, X, Music } from 'lucide-react';
import WhyThisMoment from './WhyThisMoment';

export default function StoryPlayer({ moments, memoryTitle }) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // start paused to avoid autoplay block issues
  const [showMoments, setShowMoments] = useState(false);
  const [direction, setDirection] = useState(1);
  
  // Real-time audio timing states
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [ambientMusic, setAmbientMusic] = useState(true);

  const audioRef = useRef(null);
  const ambientAudioRef = useRef(null);

  const moment = moments[current];
  const progressPercent = (currentTime / duration) * 100;

  // Sync state variables when slide changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(moment.duration || 5.0);
  }, [current, moment]);

  // Sync narration playback
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.warn("Audio play blocked by browser permissions:", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, current]);

  // Sync ambient music playback
  useEffect(() => {
    if (!ambientAudioRef.current) return;
    ambientAudioRef.current.volume = 0.08; // soft background volume
    if (isPlaying && ambientMusic) {
      ambientAudioRef.current.play().catch((e) => console.log("Ambient audio blocked:", e));
    } else {
      ambientAudioRef.current.pause();
    }
  }, [isPlaying, ambientMusic]);

  const getAudioSrc = () => {
    if (!moment || !moment.audioUrl) return '';
    const baseUrl = 'http://localhost:8000';
    const url = moment.audioUrl.startsWith('http') 
      ? moment.audioUrl 
      : `${baseUrl}${moment.audioUrl}`;
    // Add cache buster to force audio regeneration to load instantly
    return `${url}?t=${new Date().getTime()}`;
  };

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || moment.duration || 5.0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    if (current < moments.length - 1) {
      goTo(current + 1);
    } else {
      // Loop back to start and pause
      setIsPlaying(false);
      goTo(0);
    }
  };

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    setShowMoments(false);
  };

  const next = () => {
    if (current < moments.length - 1) goTo(current + 1);
  };

  const prev = () => {
    if (current > 0) goTo(current - 1);
  };

  return (
    <div className="fixed inset-0 bg-memory-base">
      {/* Main Narration Audio Element */}
      <audio
        ref={audioRef}
        src={getAudioSrc()}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onLoadedMetadata={handleMetadataLoaded}
      />

      {/* Looping Ambient Soundtrack */}
      <audio
        ref={ambientAudioRef}
        src="https://assets.mixkit.co/music/preview/mixkit-ambient-dream-117.mp3"
        loop
      />

      {/* Photo background */}
      <motion.div
        key={moment.id}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <img
          src={moment.photos?.[0] || '/images/goa-cover.png'}
          alt=""
          className="absolute inset-0 w-full h-full object-cover select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/50" />
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

        <WhyThisMoment moment={moment} />
      </div>

      {/* AI narration text */}
      <motion.div
        key={`narration-${moment.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="absolute bottom-32 sm:bottom-40 left-0 right-0 px-6 sm:px-16 z-10"
      >
        <div className="max-w-3xl mx-auto">
          <p className="font-display text-xl sm:text-2xl md:text-3xl text-white/95 leading-relaxed font-light italic text-center drop-shadow-lg">
            "{moment.aiNarration}"
          </p>
        </div>
      </motion.div>

      {/* Progress bar timeline (Instagram style) */}
      <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 z-20 px-6 sm:px-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-1.5">
            {moments.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="flex-1 h-1 rounded-full overflow-hidden bg-white/20 cursor-pointer focus:outline-none"
              >
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={false}
                  animate={{ 
                    width: i < current 
                      ? '100%' 
                      : i === current 
                        ? `${progressPercent}%` 
                        : '0%' 
                  }}
                  transition={{ duration: i === current ? 0 : 0.25 }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls panel */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-20">
        <div className="flex items-center justify-center gap-6">
          {/* Previous slide */}
          <button onClick={prev} disabled={current === 0} className="text-white/60 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={28} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full glass flex items-center justify-center text-white hover:bg-white/25 transition-colors focus:outline-none"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>

          {/* Next slide */}
          <button onClick={next} disabled={current === moments.length - 1} className="text-white/60 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight size={28} />
          </button>

          {/* Ambient Soundtrack Toggle */}
          <button
            onClick={() => setAmbientMusic(!ambientMusic)}
            className={`p-2 rounded-full transition-colors ml-2 focus:outline-none ${
              ambientMusic ? 'text-amber-400 hover:text-amber-300' : 'text-white/40 hover:text-white'
            }`}
            title="Toggle Ambient Soundtrack"
          >
            <Music size={20} />
          </button>

          {/* Moments List */}
          <button
            onClick={() => setShowMoments(!showMoments)}
            className="text-white/60 hover:text-white transition-colors ml-2 focus:outline-none"
            title="Moments list"
          >
            <List size={22} />
          </button>
        </div>
      </div>

      {/* Moments list overlay */}
      <AnimatePresence>
        {showMoments && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-80 z-30 glass-strong border-l border-white/10 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-white">Moments</h3>
                <button onClick={() => setShowMoments(false)} className="text-white/60 hover:text-white focus:outline-none">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {moments.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => goTo(i)}
                    className={`w-full text-left p-3 rounded-xl transition-colors focus:outline-none ${
                      i === current ? 'bg-violet-600/35 border border-violet-500/40' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white line-clamp-1">{m.description}</p>
                        <p className="text-xs text-white/50">{m.time} • {m.location}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
