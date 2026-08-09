import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Menu, X, Rewind as RewindIcon, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navClass = scrolled || !isLanding
    ? 'bg-[#0a0a0b]/90 backdrop-blur-md border-b border-white/10 shadow-lg'
    : 'bg-[#0a0a0b]/60 backdrop-blur-md border-b border-white/5';

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Brand + Navigation Links */}
          <div className="flex items-center gap-8 sm:gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-500 to-amber-400 p-[1.5px] shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300">
                <div className="w-full h-full rounded-[10px] bg-[#0c0c0e] flex items-center justify-center">
                  <RewindIcon size={16} className="text-white fill-white/80 group-hover:-translate-x-0.5 group-hover:scale-105 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f5f0e8] to-[#c4b5fd]">
                  REWIND
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)] animate-pulse" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link
                to="/dashboard"
                className={`transition-colors ${
                  location.pathname === '/dashboard' ? 'text-white font-medium' : 'text-[#a0998c] hover:text-white'
                }`}
              >
                Memories
              </Link>
              <Link
                to="/create"
                className={`transition-colors ${
                  location.pathname === '/create' ? 'text-white font-medium' : 'text-[#a0998c] hover:text-white'
                }`}
              >
                Create
              </Link>
              <Link
                to="/explore/goa-july-2026"
                className={`transition-colors ${
                  location.pathname.startsWith('/explore') ? 'text-white font-medium' : 'text-[#a0998c] hover:text-white'
                }`}
              >
                Explore
              </Link>
            </div>
          </div>

          {/* Right: Search, + New Memory, Auth / Avatar */}
          <div className="hidden md:flex items-center gap-4">
            <button
              aria-label="Search"
              className="p-2 rounded-full text-[#a0998c] hover:text-white hover:bg-white/5 transition-colors"
            >
              <Search size={18} />
            </button>

            <Link
              to="/create"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all backdrop-blur-sm shadow-sm"
            >
              <Plus size={15} />
              <span>New Memory</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Avatar with colorful ring */}
                <Link
                  to="/profile"
                  title="Profile Dashboard"
                  className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 cursor-pointer shadow-md hover:scale-105 transition-transform block"
                >
                  <div className="w-full h-full rounded-full bg-[#1e1e22] overflow-hidden flex items-center justify-center">
                    <img
                      src={user?.avatar || '/images/beach-moment.png'}
                      alt={user?.name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#141416]/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 space-y-3"
          >
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-lg text-[#a0998c] hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              Memories
            </Link>

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-lg text-[#a0998c] hover:text-white hover:bg-white/5 transition-colors text-sm"
              >
                Profile Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg text-[#a0998c] hover:text-white hover:bg-white/5 transition-colors text-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 rounded-lg text-[#a0998c] hover:text-white hover:bg-white/5 transition-colors text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}

            <Link
              to="/create"
              className="block px-3 py-2 rounded-lg text-[#a0998c] hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              Create
            </Link>
            <Link
              to="/explore/goa-july-2026"
              className="block px-3 py-2 rounded-lg text-[#a0998c] hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              Explore
            </Link>
            <Link
              to="/create"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-white text-black font-semibold text-sm mt-2"
            >
              <Plus size={16} />
              <span>New Memory</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
