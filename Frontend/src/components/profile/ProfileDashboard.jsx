import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  Edit3,
  Share2,
  Calendar,
  MapPin,
  Sparkles,
  Camera,
  Mic,
  Users,
  Grid,
  Heart,
  Shield,
  Bell,
  Check,
  Plus,
  Play,
  ArrowRight,
  X,
  LogOut
} from 'lucide-react';
import { memories, people } from '../../data/mockData';
import MemoryCard from '../memory/MemoryCard';
import { useAuth } from '../../context/AuthContext';

export default function ProfileDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('memories');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || 'Ankush Sharma',
    handle: user?.handle || '@ankush_rewind',
    avatar: user?.avatar || '/images/beach-moment.png',
    coverImage: '/images/goa-cover.png',
    bio: 'Capturing life’s unscripted moments 🌟 | Traveler & Storyteller',
    location: 'Bangalore, India',
    joined: user?.joined || 'January 2024',
    aiVoice: 'Warm & Nostalgic',
  });

  const [editForm, setEditForm] = useState({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const userMemories = memories;
  const taggedMemories = memories.filter((m) => m.stats.people > 3);
  const favoriteMoments = [
    {
      id: 'fav-1',
      title: 'Sunset at Anjuna Beach',
      memoryTitle: 'Goa — July 2026',
      image: '/images/goa-cover.png',
      date: 'July 14, 2026',
      likes: 24,
    },
    {
      id: 'fav-2',
      title: 'The Hidden Waterfall',
      memoryTitle: 'Goa — July 2026',
      image: '/images/hidden-beach.png',
      date: 'July 15, 2026',
      likes: 19,
    },
    {
      id: 'fav-3',
      title: 'Wrong Turn Detour',
      memoryTitle: 'Goa — July 2026',
      image: '/images/road-trip.png',
      date: 'July 14, 2026',
      likes: 31,
    },
  ];

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile({ ...editForm });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/90 text-white text-sm font-medium shadow-xl backdrop-blur-md"
          >
            <Check size={18} />
            <span>Profile updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner & Profile Info */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121215] shadow-2xl">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 relative overflow-hidden">
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/40" />
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Avatar Container with Gradient Halo */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 shadow-2xl shadow-purple-500/30">
                  <div className="w-full h-full rounded-full bg-[#1e1e22] overflow-hidden relative">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#121215] shadow-md" title="Online" />
              </div>

              {/* Name, Handle & Tags */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Pro Storyteller
                  </span>
                </div>
                <p className="text-sm text-white/50">{profile.handle}</p>
                <div className="flex items-center gap-4 text-xs text-white/60 pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-violet-400" />
                    {profile.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-violet-400" />
                    Joined {profile.joined}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Profile link copied to clipboard!');
                }}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all"
                title="Share Profile"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-medium transition-all"
                title="Log Out"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          </div>

          {/* Bio & AI Voice Info */}
          <div className="mt-5 pt-5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
              {profile.bio}
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 shrink-0">
              <Sparkles size={13} className="text-amber-400" />
              <span>AI Voice: <strong className="text-white">{profile.aiVoice}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#141417]/80 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/50">Total Vaults</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Grid size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{userMemories.length}</p>
          <p className="text-[11px] text-white/40 mt-1">Stories created</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417]/80 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:border-pink-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/50">Moments</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <Camera size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">188</p>
          <p className="text-[11px] text-white/40 mt-1">Photos & media</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417]/80 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/50">Circle Friends</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{people.length}</p>
          <p className="text-[11px] text-white/40 mt-1">Frequent companions</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#141417]/80 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/50">Voice Notes</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Mic size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">24</p>
          <p className="text-[11px] text-white/40 mt-1">AI Narrations</p>
        </div>
      </div>

      {/* Main Content Tabs & Views */}
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('memories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'memories'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid size={14} />
            <span>My Memories ({userMemories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'tagged'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={14} />
            <span>Shared & Tagged ({taggedMemories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart size={14} />
            <span>Highlights ({favoriteMoments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('circle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'circle'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={14} />
            <span>Memory Circle</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <AnimatePresence mode="wait">
          {activeTab === 'memories' && (
            <motion.div
              key="memories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Your Memory Vaults</h3>
                <Link
                  to="/create"
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  <Plus size={14} />
                  <span>Create New</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userMemories.map((mem) => (
                  <MemoryCard key={mem.id} memory={mem} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'tagged' && (
            <motion.div
              key="tagged"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-base font-semibold text-white">Group Memories & Tagged Experiences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {taggedMemories.map((mem) => (
                  <MemoryCard key={mem.id} memory={mem} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {favoriteMoments.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl overflow-hidden bg-[#141417] border border-white/10 hover:border-violet-500/40 transition-all duration-300 shadow-lg flex flex-col"
                >
                  <div className="h-44 relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-pink-400 text-xs font-semibold flex items-center gap-1">
                      <Heart size={12} className="fill-pink-400" />
                      <span>{item.likes}</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-violet-400 uppercase tracking-wider">{item.memoryTitle}</span>
                      <h4 className="text-base font-semibold text-white mt-1">{item.title}</h4>
                      <p className="text-xs text-white/50 mt-1">{item.date}</p>
                    </div>
                    <Link
                      to="/explore/goa-july-2026"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white font-medium"
                    >
                      <span>Relive Moment</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'circle' && (
            <motion.div
              key="circle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-base font-semibold text-white">Your Memory Circle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="p-4 rounded-2xl bg-[#141417] border border-white/10 flex flex-col items-center text-center hover:border-violet-500/40 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                      {person.avatar}
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-3">{person.name}</h4>
                    <span className="text-xs text-white/40 mt-0.5">Contributor</span>
                    <button className="mt-3 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium border border-white/10 transition-colors">
                      View Shared
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl space-y-6"
            >
              <div className="p-6 rounded-2xl bg-[#141417] border border-white/10 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield size={18} className="text-violet-400" />
                  <span>Privacy & Vault Controls</span>
                </h3>

                <div className="space-y-3 divide-y divide-white/5">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-medium text-white">Public Profile</p>
                      <p className="text-xs text-white/50">Allow friends to view your public story highlights</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle-checkbox accent-violet-500" />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-sm font-medium text-white">AI Voice Auto-Narration</p>
                      <p className="text-xs text-white/50">Automatically generate voice narrations for new uploaded photos</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle-checkbox accent-violet-500" />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-sm font-medium text-white">High Quality Media Archiving</p>
                      <p className="text-xs text-white/50">Store original uncompressed photos & audio</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle-checkbox accent-violet-500" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#141417] border border-white/10 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Bell size={18} className="text-pink-400" />
                  <span>Notification Preferences</span>
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Memory Tag Alerts</p>
                      <p className="text-xs text-white/50">Get notified when someone tags you in a moment</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle-checkbox accent-pink-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-[#16161a] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 relative"
            >
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 size={20} className="text-violet-400" />
                <span>Edit Profile Dashboard</span>
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Username Handle</label>
                  <input
                    type="text"
                    value={editForm.handle}
                    onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">AI Voice Style</label>
                    <select
                      value={editForm.aiVoice}
                      onChange={(e) => setEditForm({ ...editForm, aiVoice: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#222228] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      <option value="Warm & Nostalgic">Warm & Nostalgic</option>
                      <option value="Cinematic & Epic">Cinematic & Epic</option>
                      <option value="Energetic & Casual">Energetic & Casual</option>
                      <option value="Gentle Storyteller">Gentle Storyteller</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-lg hover:shadow-violet-500/30 transition-all hover:scale-105"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
