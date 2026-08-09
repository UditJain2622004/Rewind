import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemoryLoader } from '../hooks/useMemoryLoader';
import MemoryModeTabs from '../components/memory/MemoryModeTabs';
import MemoryTimeline from '../components/memory/MemoryTimeline';
import ContributorPanel from '../components/shared/ContributorPanel';
import { assembleRelive, getReliveData } from '../services/api';

const DEFAULT_BANNER = '/images/goa-cover.png';
const FALLBACK_BANNER = 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251613/WhatsApp_Image_2026-08-09_at_10.15.58_1_bo6co1.jpg';

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('test.jpg') || url.endsWith('/test.jpg')) return false;
  return true;
};

function getBestCover(memory) {
  if (!memory) return DEFAULT_BANNER;

  // 1. Direct cover if present and valid
  if (memory.cover && memory.cover !== '/images/goa-cover.png' && isValidImageUrl(memory.cover)) return memory.cover;

  // 2. First valid photo in items
  if (memory.items && memory.items.length > 0) {
    for (const item of memory.items) {
      const isVoice = item.type === 'voice' || item.type === 'voice_note' || item.type === 'audio';
      const isText = item.type === 'text' || item.type === 'text_note';
      if (!isVoice && !isText) {
        const url = item.file_url || item.url || item.preview;
        if (isValidImageUrl(url)) return url;
      }
    }
  }

  // 3. First valid photo in moments
  if (memory.moments && memory.moments.length > 0) {
    for (const moment of memory.moments) {
      if (moment.photos && moment.photos.length > 0 && isValidImageUrl(moment.photos[0])) {
        return moment.photos[0];
      }
    }
  }

  return isValidImageUrl(memory.cover) ? memory.cover : DEFAULT_BANNER;
}

export default function MemoryViewPage() {
  const { id } = useParams();
  const { memory: loadedMemory, isLoading: isLoaderLoading } = useMemoryLoader(id);
  const [memory, setMemory] = useState(loadedMemory);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [coverImg, setCoverImg] = useState(() => getBestCover(loadedMemory));

  useEffect(() => {
    if (loadedMemory) {
      setMemory(loadedMemory);
      const newCover = getBestCover(loadedMemory);
      if (newCover && newCover !== DEFAULT_BANNER) {
        setCoverImg(newCover);
      }
    }
  }, [loadedMemory]);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    try {
      await assembleRelive();
      setGenerationSuccess(true);
      alert("AI Story synthesized successfully! You can now Relive your trip.");
    } catch (err) {
      console.error(err);
      alert("Failed to synthesize memory story. Please check your credentials or backend server.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoaderLoading) {
    return (
      <div className="min-h-screen bg-memory-base flex items-center justify-center">
        <div className="text-center">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-violet-500 rounded-full mb-4"></span>
          <p className="text-memory-ivory-muted">Loading Memory Vault...</p>
        </div>
      </div>
    );
  }

  if (!memory) return null;

  const currentCoverSrc = coverImg || getBestCover(memory) || DEFAULT_BANNER;

  return (
    <main className="min-h-screen">
      {/* Cinematic cover */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden bg-[#101014]">
        <motion.img
          key={currentCoverSrc}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          src={currentCoverSrc}
          onError={() => {
            if (coverImg !== FALLBACK_BANNER) {
              setCoverImg(FALLBACK_BANNER);
            }
          }}
          alt={memory.title || 'Memory Banner'}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.85] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-memory-base via-memory-base/40 to-transparent pointer-events-none" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-2 tracking-tight drop-shadow-md">
              {memory.fullTitle || memory.title || 'Memory Vault'}
            </h1>
            <p className="text-lg text-white/80 drop-shadow">{memory.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="shrink-0"
          >
            <button
              onClick={handleGenerateStory}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-violet-600 hover:from-amber-300 hover:to-violet-500 text-white font-bold text-sm shadow-xl transition-all flex items-center gap-2 ${
                isGenerating ? 'opacity-80 cursor-not-allowed shadow-none' : 'shadow-amber-500/25'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                  <span>Synthesizing...</span>
                </>
              ) : generationSuccess ? (
                <span>✨ Story Ready!</span>
              ) : (
                <span>✨ Generate AI Story</span>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <MemoryModeTabs memoryId={memory.id} />
      </div>

      {/* Timeline */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12">
        <MemoryTimeline moments={memory.moments} />
      </div>

      {/* Contributors */}
      {memory.contributors && memory.contributors.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <ContributorPanel
            contributors={memory.contributors}
            perspectives={memory.perspectives}
          />
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-24 md:h-0" />
    </main>
  );
}
