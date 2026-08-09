import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { memories } from '../data/mockData';
import MemoryModeTabs from '../components/memory/MemoryModeTabs';
import MemoryTimeline from '../components/memory/MemoryTimeline';
import ContributorPanel from '../components/shared/ContributorPanel';

export default function MemoryViewPage() {
  const { id } = useParams();
  const memory = memories.find((m) => m.id === id) || memories[0];

  return (
    <main className="min-h-screen">
      {/* Cinematic cover */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          src={memory.cover}
          alt={memory.title}
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
              {memory.fullTitle}
            </h1>
            <p className="text-lg text-white/70">{memory.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="shrink-0"
          >
            <button
              onClick={() => alert("AI Story Engine started! Synthesizing narration and photos...")}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-violet-600 hover:from-amber-300 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <span>✨ Generate AI Story</span>
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
