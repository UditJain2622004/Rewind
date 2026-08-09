import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, ArrowRight, Layers, Music, Database, Cloud, RefreshCw } from 'lucide-react';
import ExperienceCreator from '../components/create/ExperienceCreator';
import MediaUploader from '../components/create/MediaUploader';
import AIProcessingAnimation from '../components/create/AIProcessingAnimation';
import { getDraftFromMongoDB, saveDraftToMongoDB, triggerMemoryGeneration, assembleRelive } from '../services/api';
import { saveUserMemory } from '../data/mockData';

export default function CreatePage() {
  const navigate = useNavigate();
  const [memoryId, setMemoryId] = useState(`exp_draft_${Date.now()}`);
  const [memoryName, setMemoryName] = useState('');
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Warm & Nostalgic');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saving' | 'saved'

  // Fetch pending memory draft from MongoDB on page load
  useEffect(() => {
    async function loadActiveDraft() {
      try {
        const draft = await getDraftFromMongoDB();
        if (draft) {
          if (draft._id || draft.memory_id) setMemoryId(draft._id || draft.memory_id);
          if (draft.title || draft.name) setMemoryName(draft.title || draft.name);
          if (draft.voice_style) setSelectedVoice(draft.voice_style);
          if (draft.items && draft.items.length > 0) setFiles(draft.items);
          setDraftLoaded(true);
        }
      } catch (err) {
        console.warn('Could not load draft from MongoDB:', err);
      }
    }
    loadActiveDraft();
  }, []);

  // Auto-save draft changes to MongoDB
  useEffect(() => {
    if (!memoryName && files.length === 0) return;
    
    setSavingStatus('saving');
    const timer = setTimeout(async () => {
      await saveDraftToMongoDB({
        id: memoryId,
        name: memoryName,
        title: memoryName,
        voice_style: selectedVoice,
        status: 'draft',
        items: files
      });
      setSavingStatus('saved');
    }, 1000);

    return () => clearTimeout(timer);
  }, [memoryName, files, selectedVoice, memoryId]);

  const handleGenerate = async () => {
    setProcessing(true);
    const titleText = memoryName.trim() || 'College';
    const firstPhoto = files.find((f) => f.type === 'photo');
    const photoCdnUrl = firstPhoto ? (firstPhoto.file_url || firstPhoto.url || (firstPhoto.preview && !firstPhoto.preview.startsWith('blob:') ? firstPhoto.preview : null)) : null;
    const coverUrl = photoCdnUrl || '/images/goa-cover.png';

    const newMemoryObj = {
      id: memoryId || `exp_${Date.now()}`,
      title: titleText,
      subtitle: titleText,
      fullTitle: `${titleText} — ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      cover: coverUrl,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      momentsCount: files.length || 1,
      contributorsCount: 1,
      timeAgo: 'Just now',
      category: 'milestone',
      description: `${files.length} moments saved in memory vault.`,
      items: files
    };

    try {
      // 1. Call API to assemble relive video story from hardcoded scripts & assets
      await assembleRelive();
    } catch (err) {
      console.warn("Assemble relive API call fallback/warning:", err);
    }

    try {
      // 2. Save memory to MongoDB
      await saveDraftToMongoDB({
        id: memoryId,
        name: titleText,
        title: titleText,
        voice_style: selectedVoice,
        status: 'saved',
        items: files
      });

      // 3. Trigger generation status update
      await triggerMemoryGeneration(memoryId);
    } catch (err) {
      console.warn("MongoDB draft save fallback:", err);
    }

    // Save into localStorage memories list so it shows in dashboard grid
    saveUserMemory(newMemoryObj);

    // Clear active draft in localStorage so next Create session starts clean
    try {
      localStorage.removeItem('rewind_active_memory_draft');
    } catch (e) {
      console.warn('Could not clear active draft:', e);
    }

    // Redirect to the newly created memory's page
    navigate(`/memory/${newMemoryObj.id}`);
  };

  if (processing) {
    return <AIProcessingAnimation memoryName={memoryName} />;
  }

  const bgPhotos1 = [
    'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251613/WhatsApp_Image_2026-08-09_at_10.15.58_1_bo6co1.jpg',
    'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251799/pro-image-1786251775267_bplipq.jpg',
    '/images/beach-moment.png',
    'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251631/WhatsApp_Image_2026-08-09_at_10.17.40_jnaqyq.jpg',
    '/images/road-trip.png'
  ];

  const bgPhotos2 = [
    'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251642/WhatsApp_Image_2026-08-09_at_10.17.41_aoh10n.jpg',
    '/images/dinner-moment.png',
    'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251631/WhatsApp_Image_2026-08-09_at_10.17.41_1_rwduko.jpg',
    '/images/hidden-beach.png',
    'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251634/WhatsApp_Image_2026-08-09_at_10.17.42_wgfkrh.jpg'
  ];

  const row1 = [...bgPhotos1, ...bgPhotos1];
  const row2 = [...bgPhotos2, ...bgPhotos2];

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden flex items-center justify-center bg-[#0a0a0b]">
      
      {/* Background Full-Screen Animated Sliding Photo Wall (Optimized) */}
      <div className="absolute inset-0 z-0 flex flex-col justify-around py-4 gap-6 pointer-events-none opacity-40 select-none overflow-hidden h-full w-full">
        {/* Row 1 — Slides Left */}
        <div className="flex overflow-hidden w-full">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 40 }}
            className="flex gap-5 shrink-0 [will-change:transform]"
          >
            {row1.map((src, i) => (
              <div
                key={`r1-${i}`}
                className="relative w-64 h-36 rounded-2xl overflow-hidden bg-[#141416] border border-white/10 shrink-0"
              >
                <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Row 2 — Slides Right */}
        <div className="flex overflow-hidden w-full">
          <motion.div
            animate={{ x: ['-50%', '0%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 45 }}
            className="flex gap-5 shrink-0 [will-change:transform]"
          >
            {row2.map((src, i) => (
              <div
                key={`r2-${i}`}
                className="relative w-60 h-36 rounded-2xl overflow-hidden bg-[#141416] border border-white/10 shrink-0"
              >
                <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Global dark radial vignette overlay */}
      <div className="absolute inset-0 z-10 bg-radial from-transparent via-[#0a0a0b]/40 to-[#0a0a0b]/80 pointer-events-none" />

      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-10 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: 2-Column Split Studio */}
      <div className="w-full max-w-5xl mx-auto relative z-20">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[11px] font-semibold mb-1">
              <Sparkles size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>AI Story Architect Studio</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Create <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-purple-200">memory vault.</span>
            </h1>
          </div>
        </div>

        {/* Resumed Draft Banner */}
        {draftLoaded && files.length > 0 && (
          <div className="mb-4 px-4 py-2.5 rounded-2xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-amber-400" />
              <span>
                <strong>Active Memory Story Restored:</strong> You can add more photos, audio clips, or text notes anytime before saving.
              </span>
            </div>
            <span className="text-[11px] text-white/50">{files.length} items loaded</span>
          </div>
        )}

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* LEFT PANEL: Compact Story Setup (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 bg-[#121216]/90 border border-white/15 rounded-3xl p-5 shadow-xl backdrop-blur-2xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Compact Story Title Component */}
              <ExperienceCreator initialName={memoryName} onNameSet={setMemoryName} />
            </div>

            {/* Compact Vault Summary Badge */}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-950/40 via-[#181724] to-[#0e0e12] border border-violet-500/25 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/60 font-medium">Memory Story Vault</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  {savingStatus === 'saving' ? 'Syncing...' : 'Auto-Saved'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white truncate">
                  {memoryName || 'Untitled Memory Story'}
                </h4>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/60 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <Layers size={12} className="text-amber-400" />
                  {files.length} Total items in story vault
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT PANEL: Media Dropzone & Action Button (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-7 bg-[#121216]/90 border border-white/15 rounded-3xl p-5 shadow-xl backdrop-blur-2xl space-y-5 flex flex-col justify-between"
          >
            {/* Media Uploader Component */}
            <MediaUploader initialItems={files} onItemsChanged={(items) => setFiles(items)} />

            {/* Primary Action Button — Save Memory Vault */}
            <div className="pt-3 border-t border-white/10 text-center space-y-1.5">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(124, 58, 237, 0.35)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-violet-500/25 transition-all flex items-center justify-center gap-2.5 group"
              >
                <Wand2 size={18} className="text-amber-300 group-hover:rotate-45 transition-transform duration-300" />
                <span>Save to Memory Vault</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <p className="text-[10px] text-white/40">
                Saves photos, voice notes, and text descriptions to your memory folder. Generate AI story anytime inside folder.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
