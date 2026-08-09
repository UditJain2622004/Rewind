import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, List, X, Music, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import WhyThisMoment from './WhyThisMoment';

export default function StoryPlayer({ moments, memoryTitle, memoryId }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // start paused to avoid autoplay block
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
    setDuration(moment?.duration || 5.0);
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
    return `${url}?t=${new Date().getTime()}`;
  };

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || moment?.duration || 5.0);
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

  if (!moment) return null;

  const currentPhoto = moment.photos?.[0] || '/images/goa-cover.png';

  return (
    <div className="fixed inset-0 bg-[#060608] z-50 flex items-center justify-center overflow-hidden font-sans">
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

      {/* Full-Screen Ambient Blurred Background */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={`ambient-${moment.id}`}
            src={currentPhoto}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="w-full h-full object-cover filter blur-3xl scale-125"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-radial from-transparent via-[#060608]/40 to-[#060608]" />
      </div>

      {/* Desktop External Navigation Arrows */}
      <button
        onClick={prev}
        disabled={current === 0}
        className="hidden md:flex absolute left-8 z-30 w-12 h-12 rounded-full glass items-center justify-center text-white/70 hover:text-white disabled:opacity-20 hover:scale-110 transition-all focus:outline-none"
        title="Previous Moment"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={next}
        disabled={current === moments.length - 1}
        className="hidden md:flex absolute right-8 z-30 w-12 h-12 rounded-full glass items-center justify-center text-white/70 hover:text-white disabled:opacity-20 hover:scale-110 transition-all focus:outline-none"
        title="Next Moment"
      >
        <ChevronRight size={28} />
      </button>

      {/* VERTICAL REEL/TIKTOK PHONE CARD CONTAINER (9:16 Portrait Aspect) */}
      <div className="relative w-full max-w-[430px] h-full sm:h-[92vh] sm:max-h-[860px] aspect-[9/16] sm:rounded-[36px] overflow-hidden bg-black border-0 sm:border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col justify-between select-none z-20">
        
        {/* Photo Visual Layer (Ken Burns Pan & Zoom Effect) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={moment.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-0"
          >
            <motion.img
              src={currentPhoto}
              alt=""
              initial={{ scale: 1 }}
              animate={{ scale: isPlaying ? 1.08 : 1 }}
              transition={{ duration: duration || 5, ease: 'linear' }}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlays for optimal UI visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent via-40% to-black/90 pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* TOP SECTION: Multi-segment Progress Bars & Header Info */}
        <div className="relative z-30 pt-3 px-3.5 space-y-2.5">
          
          {/* Instagram-style Top Segment Progress Bars */}
          <div className="flex gap-1">
            {moments.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="flex-1 h-1 rounded-full overflow-hidden bg-white/30 cursor-pointer focus:outline-none"
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

          {/* Top Info Bar: Back + Location Badge + Soundtrack & Why This Moment */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                title="Back"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="bg-black/50 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 flex items-center gap-1.5">
                <span className="text-sm">{moment.emoji}</span>
                <div className="leading-none">
                  <p className="text-[11px] font-bold text-white truncate max-w-[130px]">{moment.location}</p>
                  <p className="text-[9px] text-white/60">{moment.time}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAmbientMusic(!ambientMusic)}
                className={`w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors ${
                  ambientMusic ? 'text-amber-400 border-amber-400/40' : 'text-white/40'
                }`}
                title="Toggle Soundtrack"
              >
                <Music size={14} />
              </button>

              <WhyThisMoment moment={moment} />
            </div>
          </div>
        </div>

        {/* LOWER SECTION: AI Narration Caption Card & Controls */}
        <div className="relative z-30 px-4 pb-4 pt-10 flex flex-col gap-4">
          
          {/* AI Narration Text Overlay Card */}
          <motion.div
            key={`narration-${moment.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl text-center"
          >
            <p className="font-serif text-sm sm:text-base text-white/95 leading-relaxed italic font-normal drop-shadow-md">
              "{moment.aiNarration}"
            </p>
          </motion.div>

          {/* Reel Navigation & Playback Controls Bar */}
          <div className="flex items-center justify-between px-2 pt-1">
            {/* Prev Moment */}
            <button
              onClick={prev}
              disabled={current === 0}
              className="p-2 rounded-full text-white/60 hover:text-white disabled:opacity-20 transition-colors focus:outline-none"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Play/Pause Main Button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-13 h-13 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/30 flex items-center justify-center text-white border border-white/20 focus:outline-none"
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </motion.button>

            {/* Next Moment */}
            <button
              onClick={next}
              disabled={current === moments.length - 1}
              className="p-2 rounded-full text-white/60 hover:text-white disabled:opacity-20 transition-colors focus:outline-none"
            >
              <ChevronRight size={24} />
            </button>

            {/* Moments Drawer Button */}
            <button
              onClick={() => setShowMoments(!showMoments)}
              className="p-2 rounded-full text-white/60 hover:text-white transition-colors focus:outline-none"
              title="All Moments List"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Slide-Over Moments Drawer inside Vertical Frame */}
        <AnimatePresence>
          {showMoments && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-0 z-40 bg-black/90 backdrop-blur-2xl p-4 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">Story Moments</h3>
                    <p className="text-[11px] text-white/50">{moments.length} moments in story</p>
                  </div>
                  <button onClick={() => setShowMoments(false)} className="p-1 rounded-full bg-white/10 text-white/70 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  {moments.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => goTo(i)}
                      className={`w-full text-left p-3 rounded-2xl transition-all border ${
                        i === current
                          ? 'bg-violet-600/40 border-violet-500/50 text-white shadow-md'
                          : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{m.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{m.description}</p>
                          <p className="text-[10px] text-white/50">{m.time} • {m.location}</p>
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
    </div>
  );
}

