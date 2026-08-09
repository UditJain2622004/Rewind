import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { memories } from '../data/mockData';
import MemoryModeTabs from '../components/memory/MemoryModeTabs';
import MemoryTimeline from '../components/memory/MemoryTimeline';
import ContributorPanel from '../components/shared/ContributorPanel';
import { assembleRelive, getReliveData } from '../services/api';

export default function MemoryViewPage() {
  const { id } = useParams();
  
  // Set up mock fallback memory
  const mockMemory = memories.find((m) => m.id === id) || memories[0];

  const [memory, setMemory] = useState(mockMemory);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getReliveData();
        if (data && data.script) {
          // Compile real data from script
          const script = data.script;
          
          // Asset map
          const assetMap = {};
          if (data.assets_manifest) {
            data.assets_manifest.forEach(asset => {
              assetMap[asset.asset_id] = asset.file_url || asset.url;
            });
          }

          // Segments to moments
          const moments = (script.segments || []).map((seg, idx) => {
            const photos = (seg.asset_ids || []).map(aid => assetMap[aid]).filter(Boolean);
            
            // Extract location info if details exist, otherwise default to IIM Bangalore
            let location = "IIM Bangalore";
            const matchingAssetId = seg.asset_ids?.[0];
            if (matchingAssetId && data.assets_manifest) {
              const matchedAsset = data.assets_manifest.find(a => a.asset_id === matchingAssetId);
              if (matchedAsset && matchedAsset.contributor_name) {
                location = `By ${matchedAsset.contributor_name}`;
              }
            }

            return {
              id: seg.segment_id,
              time: `Moment ${idx + 1}`,
              location: location,
              emoji: seg.mood === "excited" ? "⚡" : seg.mood === "funny" ? "😂" : seg.mood === "somber" ? "🥺" : "🌟",
              description: seg.caption_text || seg.narration_text,
              aiNarration: seg.narration_text,
              photos: photos.length > 0 ? photos : [mockMemory.cover]
            };
          });

          const isGenerated = data.tts_output && data.tts_output.audio_segments && data.tts_output.audio_segments.length > 0;

          const realMemory = {
            id: id || "iimb-hackathon",
            title: "IIM Bangalore",
            subtitle: "Hackathon 2026",
            fullTitle: "IIM Bangalore — Hackathon 2026",
            cover: moments[0]?.photos?.[0] || mockMemory.cover,
            description: `${moments.length} moments saved in memory vault.`,
            contributors: (script.contributors || []).map((name, i) => ({
              id: name.toLowerCase(),
              name: name.charAt(0).toUpperCase() + name.slice(1),
              avatar: i % 2 === 0 ? "👨🏽" : "👩🏽",
              color: i % 2 === 0 ? "#38bdf8" : "#f472b6"
            })),
            moments: moments,
            perspectives: mockMemory.perspectives
          };

          setMemory(realMemory);
          if (isGenerated) {
            setGenerationSuccess(true);
          }
        }
      } catch (err) {
        console.warn("Failed to load relive data from backend, falling back to mock data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, mockMemory.cover, mockMemory.perspectives]);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    try {
      await assembleRelive();
      setGenerationSuccess(true);
      alert("AI Story synthesized successfully! You can now Relive your trip.");
    } catch (err) {
      console.error(err);
      alert("Failed to synthesize memory story. Please check your credentials or backend server.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-memory-base flex items-center justify-center">
        <div className="text-center">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-violet-500 rounded-full mb-4"></span>
          <p className="text-memory-ivory-muted">Loading Memory Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Cinematic cover */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          src={memory.cover}
          alt={memory.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-memory-base via-memory-base/40 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-2">
              {memory.fullTitle}
            </h1>
            <p className="text-lg text-white/70">{memory.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="shrink-0"
          >
            <button
              onClick={handleGenerateStory}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-violet-600 hover:from-amber-300 hover:to-violet-500 text-white font-bold text-sm shadow-xl transition-all flex items-center gap-2 ${
                isGenerating ? 'opacity-80 cursor-not-allowed shadow-none' : 'shadow-amber-500/25'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                  <span>Synthesizing...</span>
                </>
              ) : generationSuccess ? (
                <span>✨ Story Ready!</span>
              ) : (
                <span>✨ Generate AI Story</span>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <MemoryModeTabs memoryId={memory.id} />
      </div>

      {/* Timeline */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12">
        <MemoryTimeline moments={memory.moments} />
      </div>

      {/* Contributors */}
      {memory.contributors && memory.contributors.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <ContributorPanel
            contributors={memory.contributors}
            perspectives={memory.perspectives}
          />
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-24 md:h-0" />
    </main>
  );
}
