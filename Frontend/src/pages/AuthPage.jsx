import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Rewind as RewindIcon,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe,
  Play,
  Pause,
  Volume2,
  Compass,
  Smile,
  Heart,
  Flame,
  Check,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Showcase Memory Stories for the Left Panel
const showcaseStories = [
  {
    title: 'Goa Road Trip',
    subtitle: 'July 2026 • 5 friends',
    narration: '"A wrong turn on North Goa Road became the best mistake of the trip..."',
    image: '/images/goa-cover.png',
    audioDuration: '0:34',
    badge: 'Trending Vault',
  },
  {
    title: 'Hidden Beach Discovery',
    subtitle: 'July 2026 • Secret Spot',
    narration: '"For ten minutes, nobody said a word. The sunset was doing all the talking."',
    image: '/images/hidden-beach.png',
    audioDuration: '1:12',
    badge: 'AI Curated',
  },
  {
    title: 'College Farewell Night',
    subtitle: 'May 2026 • 12 Friends',
    narration: '"One last song played at midnight before everyone parted ways..."',
    image: '/images/road-trip.png',
    audioDuration: '0:45',
    badge: 'Highlight',
  },
];

const storyCategories = [
  { id: 'trips', label: '🌴 Road Trips & Travel', icon: '✈️' },
  { id: 'college', label: '🎓 College & Farewell', icon: '🎉' },
  { id: 'hangouts', label: '🍜 Dinners & Hangouts', icon: '🍕' },
  { id: 'milestones', label: '🌅 Sunsets & Memories', icon: '✨' },
];

export default function AuthPage({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Showcase Carousel Index
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Signup extra preferences
  const [selectedCategory, setSelectedCategory] = useState('trips');
  const [selectedVoice, setSelectedVoice] = useState('Warm & Nostalgic');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // Auto-rotate showcase story cards every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setStoryIndex((prev) => (prev + 1) % showcaseStories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const activeStory = showcaseStories[storyIndex];

  // Calculate Password Strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-white/10' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 50, label: 'Medium', color: 'bg-amber-400' };
    if (score === 3) return { score: 75, label: 'Strong', color: 'bg-violet-400' };
    return { score: 100, label: 'Unbreakable Vault 🔒', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleQuickDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      login('ankush@rewind.app', 'demopassword');
      setLoading(false);
      navigate('/dashboard');
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!formData.agreeTerms) {
        setError('Please accept the Terms of Service & Privacy Policy');
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        login(formData.email, formData.password);
      } else {
        signup(formData.name, formData.email, formData.password);
      }
      setLoading(false);
      navigate('/dashboard');
    }, 900);
  };

  return (
    <main className="min-h-screen pt-20 pb-16 flex items-center justify-center px-4 sm:px-6 relative">
      
      {/* Outer Glowing Glassmorphic Container */}
      <div className="w-full max-w-5xl rounded-3xl bg-[#121216]/90 border border-white/15 shadow-[0_0_60px_rgba(124,58,237,0.15)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-2xl relative">
        
        {/* Animated Gradient Accent Border Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400" />

        {/* Left Side: Interactive Story Showcase Panel (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-br from-[#161324] via-[#111019] to-[#0c0c0e] border-r border-white/10 relative overflow-hidden">
          
          {/* Ambient Glow background */}
          <div className="absolute top-10 -left-10 w-72 h-72 bg-violet-600/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-10 -right-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-500 to-amber-400 p-[1.5px] shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-[14px] bg-[#0c0c0e] flex items-center justify-center">
                  <RewindIcon size={20} className="text-white fill-white/80" />
                </div>
              </div>
              <span className="text-xl font-black tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f5f0e8] to-[#c4b5fd]">
                REWIND
              </span>
            </Link>

            <div className="mt-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold">
                <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>Living Story Vault</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                {mode === 'login' ? (
                  <>Welcome back to your <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-purple-200">memories.</span></>
                ) : (
                  <>Turn unscripted moments into <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-purple-200">stories.</span></>
                )}
              </h2>
            </div>
          </div>

          {/* Center Interactive Story Preview Card Carousel */}
          <div className="relative z-10 my-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={storyIndex}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-[#1a1922]/90 border border-white/15 p-4 shadow-xl relative overflow-hidden group"
              >
                {/* Background image preview */}
                <div className="h-32 rounded-xl overflow-hidden relative mb-3">
                  <img
                    src={activeStory.image}
                    alt={activeStory.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-violet-300 border border-white/10">
                    {activeStory.badge}
                  </span>
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                    <div>
                      <h4 className="text-sm font-bold">{activeStory.title}</h4>
                      <p className="text-[11px] text-white/70">{activeStory.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* AI Narration Quote + Audio Equalizer simulation */}
                <div className="space-y-2 text-xs">
                  <p className="text-white/80 italic line-clamp-2">
                    {activeStory.narration}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-[11px] font-semibold border border-violet-500/30 transition-all"
                    >
                      {isPlayingAudio ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlayingAudio ? 'Playing AI Voice...' : `Listen (${activeStory.audioDuration})`}</span>
                    </button>

                    {/* Equalizer Bars */}
                    <div className="flex items-end gap-1 h-3">
                      <span className={`w-0.5 bg-violet-400 rounded-full transition-all ${isPlayingAudio ? 'h-3 animate-pulse' : 'h-1.5'}`} />
                      <span className={`w-0.5 bg-pink-400 rounded-full transition-all ${isPlayingAudio ? 'h-2 animate-bounce' : 'h-2'}`} />
                      <span className={`w-0.5 bg-amber-400 rounded-full transition-all ${isPlayingAudio ? 'h-3.5 animate-pulse' : 'h-1'}`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Dot Indicators */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {showcaseStories.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setStoryIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === storyIndex ? 'w-5 bg-violet-400' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Bottom Live Community Counter */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                <span className="inline-block w-6 h-6 rounded-full bg-violet-500 text-center text-[10px] leading-6 text-white font-bold border border-[#0c0c0e]">👨🏽</span>
                <span className="inline-block w-6 h-6 rounded-full bg-pink-500 text-center text-[10px] leading-6 text-white font-bold border border-[#0c0c0e]">👩🏽</span>
                <span className="inline-block w-6 h-6 rounded-full bg-amber-500 text-center text-[10px] leading-6 text-white font-bold border border-[#0c0c0e]">👨🏻</span>
              </div>
              <span className="text-[11px]">14,200+ stories preserved</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Vault
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Auth Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          
          {/* Header Mobile Brand & Mode Switcher */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-amber-400 p-[1.5px]">
                <div className="w-full h-full rounded-[10px] bg-[#0c0c0e] flex items-center justify-center">
                  <RewindIcon size={16} className="text-white" />
                </div>
              </div>
              <span className="text-lg font-black tracking-wider text-white">REWIND</span>
            </Link>

            {/* Mode Switcher Pills */}
            <div className="flex items-center p-1 rounded-full bg-[#1b1b22] border border-white/10 ml-auto">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Quick Demo Login Banner */}
          <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-violet-900/40 via-purple-900/20 to-indigo-900/40 border border-violet-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Want to explore instantly?</p>
                <p className="text-[11px] text-white/60">Try with a pre-filled demo vault</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              🚀 1-Click Demo
            </button>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {mode === 'login' ? (
                <>Log in to your <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-purple-200">account.</span></>
              ) : (
                <>Create your <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-purple-200">storyteller account.</span></>
              )}
            </h1>
            <p className="text-xs text-white/50 mt-1">
              {mode === 'login'
                ? 'Enter your credentials to access your memories'
                : 'Custom AI narration • Multi-person contributor vaults'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
            >
              <Zap size={14} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Ankush Sharma"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  name="email"
                  placeholder="ankush@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-white/70">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your email!')}
                    className="text-[11px] text-violet-400 hover:text-violet-300 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator for Signup */}
              {mode === 'signup' && formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/50">Security Level:</span>
                    <span className="font-medium text-white">{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Interactive Category Preference Pick */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    What memories will you record most?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {storyCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-violet-600/30 border-violet-500 text-white shadow-sm'
                            : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Checkboxes */}
            {mode === 'login' ? (
              <div className="flex items-center justify-between text-xs text-white/70 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-violet-500"
                  />
                  <span>Remember this device</span>
                </label>
              </div>
            ) : (
              <div className="text-xs text-white/70 pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className="mt-0.5 rounded accent-violet-500"
                  />
                  <span>
                    I agree to Rewind's <a href="#" className="underline text-white">Terms of Service</a> & <a href="#" className="underline text-white">Privacy Policy</a>
                  </span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Vault' : 'Create Storyteller Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#121216] text-[11px] text-white/40 uppercase tracking-widest">
              Or continue with
            </span>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                login('google.user@rewind.app', 'googlepass');
                navigate('/dashboard');
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-all"
            >
              <Globe size={15} className="text-amber-400" />
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => {
                login('apple.user@rewind.app', 'applepass');
                navigate('/dashboard');
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-all"
            >
              <ShieldCheck size={15} className="text-violet-400" />
              <span>Apple</span>
            </button>
          </div>

          {/* Toggle Mode Footer Link */}
          <p className="text-center text-xs text-white/60 mt-5">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="text-violet-400 font-semibold hover:underline"
                >
                  Sign up for free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-violet-400 font-semibold hover:underline font-semibold"
                >
                  Log in here
                </button>
              </>
            )}
          </p>

        </div>
      </div>
    </main>
  );
}
