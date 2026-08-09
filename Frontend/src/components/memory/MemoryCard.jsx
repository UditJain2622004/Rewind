import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, Users, Sparkles, Play, ArrowUpRight } from 'lucide-react';

export default function MemoryCard({ memory, index = 0, featured = false }) {
  if (!memory) return null;

  const stats = memory.stats || {
    people: memory.contributorsCount || 1,
    days: 1,
    moments: memory.momentsCount || (memory.items ? memory.items.length : 1)
  };

  const subtitleText = memory.subtitle || memory.date || 'Memory Story';
  const initialCover = (memory.cover && !memory.cover.startsWith('blob:')) ? memory.cover : '/images/beach-moment.png';
  const [imgSrc, setImgSrc] = useState(initialCover);

  useEffect(() => {
    if (memory.cover && !memory.cover.startsWith('blob:')) {
      setImgSrc(memory.cover);
    } else {
      setImgSrc('/images/beach-moment.png');
    }
  }, [memory.cover]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-3xl cursor-pointer border border-white/10 hover:border-purple-500/40 bg-[#141416] shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 ${
        featured ? 'aspect-[16/9]' : 'aspect-[3/4]'
      }`}
    >
      <Link to={`/memory/${memory.id}`} className="block w-full h-full">
        {/* Cover image with zoom */}
        <img
          src={imgSrc}
          onError={() => setImgSrc('/images/beach-moment.png')}
          alt={memory.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 filter brightness-[0.8] contrast-[1.05]"
          loading="lazy"
        />

        {/* Dynamic Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-medium text-white/80 uppercase">
            {subtitleText}
          </span>

          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-black group-hover:scale-110 transition-all shadow-md">
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-10">
          <h3 className={`font-display font-bold text-white mb-1 tracking-tight group-hover:text-amber-100 transition-colors ${
            featured ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
          }`}>
            {memory.title}
          </h3>

          <div className="flex items-center gap-3 text-[11px] text-white/60 mt-2">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-violet-400" />
              {stats.people}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-amber-400" />
              {stats.days}d
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-400" />
              {stats.moments} moments
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
