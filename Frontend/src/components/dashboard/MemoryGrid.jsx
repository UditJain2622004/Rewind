import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import MemoryCard from '../memory/MemoryCard';

export default function MemoryGrid({ memories }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {memories.map((memory, i) => (
        <MemoryCard key={memory.id} memory={memory} index={i} />
      ))}

      {/* Add New Memory Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (memories.length + 1) * 0.05, duration: 0.4 }}
        whileHover={{ y: -4 }}
        className="aspect-[3/4] rounded-2xl border border-dashed border-white/15 hover:border-white/30 bg-[#141416]/40 hover:bg-[#141416]/70 p-5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
      >
        <Link to="/create" className="w-full h-full flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 group-hover:bg-white/[0.08] flex items-center justify-center text-white/60 group-hover:text-white transition-all">
            <Plus size={20} />
          </div>
          <h4 className="font-display font-medium text-white text-sm mt-1">
            New Story
          </h4>
          <p className="text-white/40 text-xs">
            Add photos & audio
          </p>
        </Link>
      </motion.div>
    </div>
  );
}
