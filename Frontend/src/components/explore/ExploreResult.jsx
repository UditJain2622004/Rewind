import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ExploreResult({ result, memoryId }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* User Question */}
      <div className="flex justify-end">
        <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-md">
          <p className="text-xs sm:text-sm text-white">{result.question}</p>
        </div>
      </div>

      {/* AI Answer */}
      <div className="flex justify-start">
        <div className="bg-[#18181c] border border-white/10 rounded-2xl rounded-tl-xs p-4 max-w-lg space-y-3">
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            {result.answer}
          </p>

          {/* Related Photo */}
          {result.relatedPhoto && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img
                src={result.relatedPhoto}
                alt="Moment"
                className="w-full h-40 sm:h-48 object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Moment Link */}
          {result.momentId && (
            <div className="pt-1">
              <Link
                to={`/relive/${memoryId || 'goa-july-2026'}`}
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                <span>Jump to moment</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
