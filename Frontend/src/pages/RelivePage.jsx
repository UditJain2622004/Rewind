import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useMemoryLoader } from '../hooks/useMemoryLoader';
import StoryPlayer from '../components/relive/StoryPlayer';

export default function RelivePage() {
  const { id } = useParams();
  const { memory } = useMemoryLoader(id);

  if (!memory || !memory.moments || memory.moments.length === 0) {
    return (
      <div className="fixed inset-0 bg-memory-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-memory-ivory-muted mb-4">No moments to relive yet.</p>
          <Link to={`/memory/${memory.id}`} className="text-memory-lavender hover:underline">
            ← Back to memory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Back button */}
      <Link
        to={`/memory/${memory.id}`}
        className="fixed top-4 left-4 z-40 glass rounded-full p-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
      </Link>

      <StoryPlayer moments={memory.moments} memoryTitle={memory.fullTitle} />
    </>
  );
}
