import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

export default function VoiceNotePlayer({ duration, transcript, compact = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  // Generate random waveform bars
  const bars = useRef(
    Array.from({ length: compact ? 20 : 40 }, () => Math.random() * 0.8 + 0.2)
  ).current;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 50);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-memory-violet/20 hover:bg-memory-violet/30 flex items-center justify-center text-memory-lavender transition-colors flex-shrink-0"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-[2px] h-8">
            {bars.map((height, i) => {
              const isActive = (i / bars.length) * 100 <= progress;
              return (
                <motion.div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-150 ${
                    isActive ? 'bg-memory-lavender' : 'bg-memory-surface-light'
                  }`}
                  style={{ height: `${height * 100}%` }}
                  animate={isPlaying && isActive ? { scaleY: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3, repeat: isPlaying ? Infinity : 0, repeatDelay: 0.1 }}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-memory-ivory-muted">{duration}</span>
            {transcript && !compact && (
              <span className="text-xs text-memory-ivory-muted truncate ml-2">🎙️ {transcript}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
