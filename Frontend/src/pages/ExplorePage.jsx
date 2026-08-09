import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Users, Calendar, MapPin, Play, MessageSquare, Compass } from 'lucide-react';
import { memories, exploreConversations, suggestedQuestions, people } from '../data/mockData';
import MemoryExplorer from '../components/explore/MemoryExplorer';

export default function ExplorePage() {
  const { id } = useParams();
  const memory = memories.find((m) => m.id === id) || memories[0];

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-12 px-4 sm:px-6 relative overflow-hidden flex items-center justify-center">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto relative z-10">
        
        {/* Top Header Link */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to={`/memory/${memory.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Back to {memory.title} Vault</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-white/50">
            <Sparkles size={13} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>AI Memory Assistant Engine Active</span>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Vault Information & Quick Prompts (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-4 bg-[#121216]/90 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl space-y-5"
          >
            {/* Vault Cover Card */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
              <div className="h-40 relative">
                <img
                  src={memory.cover}
                  alt={memory.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/30" />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-amber-300 border border-white/10">
                  {memory.subtitle}
                </span>
              </div>

              <div className="p-3 pt-0">
                <h3 className="text-lg font-bold text-white tracking-tight">{memory.fullTitle}</h3>
                <p className="text-xs text-white/60 mt-0.5">{memory.description}</p>
              </div>
            </div>

            {/* Contributors Avatars */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                <Users size={14} className="text-violet-400" />
                <span>Memory Circle ({people.length})</span>
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {people.map((p) => (
                  <div key={p.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 shrink-0">
                    <span>{p.avatar}</span>
                    <span className="text-[11px] font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Link: Relive 3D */}
            <div className="pt-2">
              <Link
                to={`/relive/${memory.id}`}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 border border-violet-500/40 text-violet-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Play size={14} className="fill-violet-300" />
                <span>Launch 3D Cinema Replay</span>
              </Link>
            </div>
          </motion.div>

          {/* RIGHT PANEL: AI Chat Stream & Conversation (8 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-8 bg-[#121216]/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl h-[calc(100vh-10rem)] max-h-[640px] flex flex-col overflow-hidden"
          >
            <MemoryExplorer
              conversations={exploreConversations}
              suggestedQuestions={suggestedQuestions}
              memoryId={memory.id}
              memoryTitle={memory.title}
            />
          </motion.div>

        </div>
      </div>
    </main>
  );
}
