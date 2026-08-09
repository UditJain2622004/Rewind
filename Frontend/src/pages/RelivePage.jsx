import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wand2, Loader2, AlertTriangle } from 'lucide-react';
import { memories, getAllMemories } from '../data/mockData';
import { useMemoryLoader } from '../hooks/useMemoryLoader';
import StoryPlayer from '../components/relive/StoryPlayer';
import { getReliveData, assembleRelive } from '../services/api';

export default function RelivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { memory: loadedMemory } = useMemoryLoader(id);
  const [memory, setMemory] = useState(() => {
    const all = getAllMemories();
    return all.find((m) => m.id === id) || loadedMemory || all[0];
  });

  const [reliveData, setReliveData] = useState(null);   // null = loading, false = not generated
  const [loadError, setLoadError] = useState('');
  const [assembling, setAssembling] = useState(false);

  useEffect(() => {
    if (loadedMemory) setMemory(loadedMemory);
  }, [loadedMemory]);

  function buildMoments(data) {
    const { script, assets_manifest, tts_output } = data;
    if (!script?.segments?.length) return null;

    const assetMap = {};
    (assets_manifest || []).forEach((a) => { assetMap[a.asset_id] = a.file_url || a.url; });

    const audioMap = {};
    (tts_output?.audio_segments || []).forEach((a) => { audioMap[a.segment_id] = a; });

    return script.segments.map((seg, i) => {
      const firstAssetId = seg.asset_ids?.[0];
      const assetUrl = firstAssetId ? assetMap[firstAssetId] : null;
      const audio = audioMap[seg.segment_id];

      return {
        id: seg.segment_id,
        time: `Segment ${i + 1}`,
        location: seg.caption_text || 'Memory moment',
        emoji: seg.mood === 'funny' ? '😄' : seg.mood === 'nostalgic' ? '🌅' : seg.mood === 'excited' ? '⚡' : seg.mood === 'somber' ? '💫' : '✨',
        description: seg.caption_text || seg.narration_text?.slice(0, 60),
        aiNarration: seg.narration_text,
        photos: [assetUrl || memory?.cover || '/images/goa-cover.png'].filter(Boolean),
        audioUrl: audio?.audio_url ? (audio.audio_url.startsWith('http') ? audio.audio_url : `http://localhost:8000${audio.audio_url}`) : null,
        duration: audio?.duration_sec || 5.0,
        mood: seg.mood,
        day: 1,
        people: [],
        voiceNote: null,
      };
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getReliveData(id);
        if (!cancelled) {
          const moments = buildMoments(data);
          if (moments && moments.length > 0) {
            setReliveData({ moments, raw: data });
          } else if (memory?.moments?.length > 0) {
            setReliveData({ moments: memory.moments, raw: null });
          } else {
            setReliveData(false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (memory?.moments?.length > 0) {
            setReliveData({ moments: memory.moments, raw: null });
          } else {
            setReliveData(false);
          }
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, memory]);

  const handleAssembleAndReload = async () => {
    setAssembling(true);
    try {
      await assembleRelive(id);
      const data = await getReliveData(id);
      const moments = buildMoments(data);
      setReliveData(moments?.length ? { moments, raw: data } : false);
    } catch (err) {
      setLoadError(err.message || 'Assembly failed');
    } finally {
      setAssembling(false);
    }
  };

  // Loading state
  if (reliveData === null) {
    return (
      <div className="fixed inset-0 bg-memory-base flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="text-violet-400 animate-spin" />
        <p className="text-white/60 text-sm">Loading your story…</p>
      </div>
    );
  }

  // Not yet generated
  if (reliveData === false) {
    return (
      <div className="fixed inset-0 bg-memory-base flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400/20 to-violet-600/20 border border-white/10 flex items-center justify-center">
          <Wand2 size={28} className="text-amber-400" />
        </div>
        <div>
          <p className="text-white font-bold text-lg mb-1">AI Story not generated yet</p>
          <p className="text-white/50 text-sm max-w-xs">
            Go to the memory vault and click "Generate AI Story" to create your narrated Relive experience.
          </p>
        </div>
        {loadError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-left max-w-sm">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{loadError}</p>
          </div>
        )}
        <div className="flex gap-3">
          <Link
            to={`/memory/${memory.id}`}
            className="px-5 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            ← Back to Vault
          </Link>
          <button
            onClick={handleAssembleAndReload}
            disabled={assembling}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-violet-600 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
          >
            {assembling ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {assembling ? 'Assembling audio…' : 'Assemble Audio & Play'}
          </button>
        </div>
      </div>
    );
  }

  const { moments } = reliveData;

  return (
    <StoryPlayer moments={moments} memoryTitle={memory?.fullTitle || memory?.title} memoryId={memory?.id} />
  );
}
