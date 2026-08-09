import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, MessageCircle, Share2 } from 'lucide-react';

const modes = [
  {
    id: 'relive',
    icon: Play,
    symbol: '✦',
    title: 'RELIVE',
    subtitle: 'Take me back',
    color: 'from-violet-600 to-purple-500',
    glow: 'shadow-violet-500/30',
    path: 'relive',
  },
  {
    id: 'explore',
    icon: MessageCircle,
    symbol: '◉',
    title: 'EXPLORE',
    subtitle: 'Ask your memory',
    color: 'from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/30',
    path: 'explore',
  },
  {
    id: 'share',
    icon: Share2,
    symbol: '↗',
    title: 'SHARE',
    subtitle: 'Tell the story',
    color: 'from-amber-500 to-orange-400',
    glow: 'shadow-amber-500/30',
    path: 'share',
  },
];

export default function MemoryModeTabs({ memoryId }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {modes.map((mode, i) => {
        const Icon = mode.icon;
        return (
          <Link key={mode.id} to={`/${mode.path}/${memoryId}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 cursor-pointer group glass border border-white/8 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:${mode.glow}`}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

              <div className="relative z-10 text-center">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} mb-4 shadow-lg ${mode.glow}`}>
                  <Icon size={24} className="text-white" />
                </div>

                <div className="mb-1">
                  <span className="text-xs text-memory-ivory-muted mr-1">{mode.symbol}</span>
                  <span className="font-display text-xl font-semibold text-memory-ivory tracking-wider">
                    {mode.title}
                  </span>
                </div>

                <p className="text-sm text-memory-ivory-muted">{mode.subtitle}</p>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
