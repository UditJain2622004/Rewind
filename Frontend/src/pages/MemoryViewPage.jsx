import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, Wand2, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { memories, getAllMemories } from '../data/mockData';
import { useMemoryLoader } from '../hooks/useMemoryLoader';
import MemoryModeTabs from '../components/memory/MemoryModeTabs';
import MemoryTimeline from '../components/memory/MemoryTimeline';
import ContributorPanel from '../components/shared/ContributorPanel';
import { runFullPipeline } from '../services/api';

const DEFAULT_BANNER = '/images/goa-cover.png';
const FALLBACK_BANNER = 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251613/WhatsApp_Image_2026-08-09_at_10.15.58_1_bo6co1.jpg';

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('test.jpg') || url.endsWith('/test.jpg')) return false;
  return true;
};

function getBestCover(memory) {
  if (!memory) return DEFAULT_BANNER;
  if (memory.cover && memory.cover !== '/images/goa-cover.png' && isValidImageUrl(memory.cover)) return memory.cover;
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
  if (memory.moments && memory.moments.length > 0) {
    for (const moment of memory.moments) {
      if (moment.photos && moment.photos.length > 0 && isValidImageUrl(moment.photos[0])) {
        return moment.photos[0];
      }
    }
  }
  return isValidImageUrl(memory.cover) ? memory.cover : DEFAULT_BANNER;
}

// Pipeline steps shown in the progress UI
const PIPELINE_STEPS = [
  { key: 'Understanding your assets', label: 'Understanding assets via AI Vision + STT', icon: '🔍' },
  { key: 'Enriching image descriptions', label: 'Enriching image descriptions with context', icon: '✨' },
  { key: 'Synthesising your memory', label: 'Synthesising your memory story', icon: '🧠' },
  { key: 'Writing your story scripts', label: 'Writing narration scripts', icon: '📝' },
  { key: 'Done', label: 'AI Story ready!', icon: '🎬' },
];

function GenerateModal({ memoryId, memoryTitle, onClose, onDone }) {
  const [phase, setPhase] = useState('idle'); // idle | running | done | error
  const [currentStep, setCurrentStep] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleStart = async () => {
    setPhase('running');
    setCurrentStep(0);
    try {
      await runFullPipeline(memoryId, ({ step, progress }) => {
        setStepLabel(step);
        const idx = PIPELINE_STEPS.findIndex((s) => step.includes(s.key));
        if (idx >= 0) setCurrentStep(idx);
      });
      setCurrentStep(PIPELINE_STEPS.length - 1);
      setPhase('done');
      setTimeout(() => onDone(), 1800);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Pipeline failed. Check backend logs.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#111115] border border-white/15 rounded-3xl p-7 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-violet-600 flex items-center justify-center">
            <Wand2 size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Generate AI Story</h3>
            <p className="text-xs text-white/50 truncate max-w-[220px]">{memoryTitle}</p>
          </div>
        </div>

        {phase === 'idle' && (
          <>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              This will analyse your photos and voice notes with AI Vision + Saaras STT,
              build a contextual memory, and write narration scripts — ready for the Relive player.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-violet-600 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Sparkles size={15} />
                Generate Now
              </button>
            </div>
          </>
        )}

        {phase === 'running' && (
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    active ? 'bg-violet-500/15 border border-violet-500/30' : 'opacity-40'
                  }`}
                >
                  <span className="text-lg w-6 text-center">
                    {done ? '✅' : active ? <Loader2 size={16} className="text-violet-300 animate-spin" /> : step.icon}
                  </span>
                  <span className={`text-sm font-medium ${active ? 'text-white' : 'text-white/60'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
            <p className="text-[11px] text-white/40 text-center pt-2">
              This takes 1–3 minutes depending on the number of assets…
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
            <p className="text-white font-bold">Your AI Story is ready!</p>
            <p className="text-xs text-white/50">Redirecting to the Relive player…</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-900/20 border border-red-500/30">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{errorMsg}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function MemoryViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { memory: loadedMemory, isLoading: isLoaderLoading } = useMemoryLoader(id);
  const [memory, setMemory] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [coverImg, setCoverImg] = useState(() => getBestCover(loadedMemory));

  useEffect(() => {
    if (loadedMemory) {
      setMemory(loadedMemory);
      const newCover = getBestCover(loadedMemory);
      if (newCover && newCover !== DEFAULT_BANNER) {
        setCoverImg(newCover);
      }
    } else {
      const all = getAllMemories();
      setMemory(all.find((m) => m.id === id) || all[0]);
    }
  }, [id, loadedMemory]);

  if (isLoaderLoading && !memory) {
    return (
      <div className="min-h-screen bg-memory-base flex items-center justify-center">
        <div className="text-center">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-violet-500 rounded-full mb-4"></span>
          <p className="text-white/60">Loading Memory Vault...</p>
        </div>
      </div>
    );
  }

  if (!memory) return null;

  const currentCoverSrc = coverImg || memory.cover || getBestCover(memory) || DEFAULT_BANNER;

  return (
    <>
      <main className="min-h-screen">
        {/* Cinematic cover */}
        <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden bg-[#101014]">
          <motion.img
            key={currentCoverSrc}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            src={currentCoverSrc}
            onError={() => {
              if (coverImg !== FALLBACK_BANNER) {
                setCoverImg(FALLBACK_BANNER);
              }
            }}
            alt={memory.title || 'Memory Banner'}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-memory-base via-memory-base/40 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-2">
                {memory.fullTitle || memory.title || 'Memory Vault'}
              </h1>
              <p className="text-lg text-white/70">{memory.description}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="shrink-0 flex flex-col sm:flex-row gap-2"
            >
              {/* Relive Button */}
              <button
                onClick={() => navigate(`/relive/${memory.id}`)}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                <Play size={15} className="fill-white" />
                Relive
              </button>

              {/* Generate AI Story Button */}
              <button
                onClick={() => setShowGenerate(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-violet-600 hover:from-amber-300 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                <Wand2 size={15} />
                Generate AI Story
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

        <div className="h-24 md:h-0" />
      </main>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerate && (
          <GenerateModal
            memoryId={memory.id}
            memoryTitle={memory.fullTitle || memory.title}
            onClose={() => setShowGenerate(false)}
            onDone={() => {
              setShowGenerate(false);
              navigate(`/relive/${memory.id}`);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
