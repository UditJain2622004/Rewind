import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useMemoryLoader } from '../hooks/useMemoryLoader';
import StoryGenerator from '../components/share/StoryGenerator';

export default function SharePage() {
  const { id } = useParams();
  const { memory } = useMemoryLoader(id);

  if (!memory) return null;

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-32 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          to={`/memory/${memory.id}`}
          className="inline-flex items-center gap-2 text-sm text-memory-ivory-muted hover:text-memory-ivory mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to {memory.title}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-memory-ivory mb-2">
            Tell your story
          </h1>
          <p className="text-memory-ivory-muted text-lg">
            Choose a format and style to share your {memory.title} experience
          </p>
        </motion.div>

        {/* Story Generator */}
        <StoryGenerator memory={memory} />
      </div>
    </main>
  );
}
