import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import FeaturedMemory from './FeaturedMemory';
import MemoryGrid from './MemoryGrid';
import { memories, getAllMemories } from '../../data/mockData';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'trip', label: 'Travel' },
  { id: 'celebration', label: 'Celebrations' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'wedding', label: 'Weddings' },
];

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allMemoriesList, setAllMemoriesList] = useState([]);

  useEffect(() => {
    setAllMemoriesList(getAllMemories());
  }, []);

  const featured = memories[0];
  const otherMemories = allMemoriesList.length > 0 ? allMemoriesList : memories;

  // Filter memories by category & search query
  const filteredMemories = otherMemories.filter((mem) => {
    const memTitle = mem.title || mem.fullTitle || '';
    const memSub = mem.subtitle || '';
    const memDesc = mem.description || '';

    const matchesSearch = memTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memSub.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memDesc.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'all') return true;
    if (activeCategory === 'trip' && (mem.id.includes('goa') || mem.id.includes('bangalore') || mem.category === 'trip')) return true;
    if (activeCategory === 'celebration' && (mem.id.includes('birthday') || mem.category === 'celebration')) return true;
    if (activeCategory === 'milestone' && (mem.id.includes('college') || mem.category === 'milestone')) return true;
    if (activeCategory === 'wedding' && (mem.id.includes('wedding') || mem.category === 'wedding')) return true;
    return true;
  });

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Welcome back, <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-purple-200">Ankush.</span>
          </h1>
          <p className="text-white/50 text-sm mt-0.5">
            {memories.length} stories in your vault
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={14} />
          <span>New Memory</span>
        </Link>
      </div>

      {/* Featured Memory */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FeaturedMemory memory={featured} />
      </motion.div>

      {/* Your Memories Section with Live Filters & Search */}
      <div className="space-y-4">
        {/* Section Header + Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#141416] border border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#141416] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Grid of filtered memories */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchQuery}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {filteredMemories.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-[#141416]/40 border border-white/5 space-y-2">
                <p className="text-sm text-white/50">
                  No memories found for "{searchQuery}".
                </p>
              </div>
            ) : (
              <MemoryGrid memories={filteredMemories} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
