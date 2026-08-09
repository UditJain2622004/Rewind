import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';
import PageTransition from './components/layout/PageTransition';
import WaterEffectCanvas from './components/shared/WaterEffectCanvas';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';
import MemoryViewPage from './pages/MemoryViewPage';
import RelivePage from './pages/RelivePage';
import ExplorePage from './pages/ExplorePage';
import SharePage from './pages/SharePage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  const location = useLocation();
  const isFullscreen = location.pathname.startsWith('/relive');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-memory-base relative overflow-x-hidden">
        {/* Global Interactive Water Ripple & Ambient Bubbles Canvas */}
        <WaterEffectCanvas />

        {!isFullscreen && <Navbar />}

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><AuthPage initialMode="login" /></PageTransition>} />
            <Route path="/signup" element={<PageTransition><AuthPage initialMode="signup" /></PageTransition>} />
            <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
            <Route path="/library" element={<PageTransition><DashboardPage /></PageTransition>} />
            <Route path="/create" element={<PageTransition><CreatePage /></PageTransition>} />
            <Route path="/memory/:id" element={<PageTransition><MemoryViewPage /></PageTransition>} />
            <Route path="/relive/:id" element={<RelivePage />} />
            <Route path="/explore/:id" element={<PageTransition><ExplorePage /></PageTransition>} />
            <Route path="/share/:id" element={<PageTransition><SharePage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
          </Routes>
        </AnimatePresence>

        {!isFullscreen && <MobileNav />}
      </div>
    </AuthProvider>
  );
}
