import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Plus, Compass, Search, User } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

const tabs = [
  { to: '/dashboard', icon: Home, label: 'Memories' },
  { to: '/explore/goa-july-2026', icon: Compass, label: 'Explore' },
  { to: '/create', icon: Plus, label: 'Create', isMain: true },
  { to: '/dashboard', icon: Search, label: 'Search' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  const isMobile = useIsMobile();
  const location = useLocation();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/8 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;

          if (tab.isMain) {
            return (
              <Link key={tab.label} to={tab.to} className="-mt-6">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-memory-violet to-memory-lavender flex items-center justify-center shadow-lg shadow-memory-violet/30"
                >
                  <Icon size={24} className="text-white" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-memory-lavender' : 'text-memory-ivory-muted'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
