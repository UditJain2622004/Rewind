import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useMemoryLoader } from '../hooks/useMemoryLoader';
import StoryPlayer from '../components/relive/StoryPlayer';
import { getReliveData } from '../services/api';

export default function RelivePage() {
  const { id } = useParams();
  const { memory } = useMemoryLoader(id);
  
  const [moments, setMoments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getReliveData();
        if (data && data.script && data.script.segments) {
          // Compile backend data
          const assetMap = {};
          if (data.assets_manifest) {
            data.assets_manifest.forEach(asset => {
              assetMap[asset.asset_id] = asset.file_url || asset.url;
            });
          }
          
          const audioMap = {};
          if (data.tts_output && data.tts_output.audio_segments) {
            data.tts_output.audio_segments.forEach(seg => {
              audioMap[seg.segment_id] = {
                audio_url: seg.audio_url,
                duration_sec: seg.duration_sec
              };
            });
          }
          
          const compiled = data.script.segments.map((seg, idx) => {
            const audioDetails = audioMap[seg.segment_id] || {};
            const photos = (seg.asset_ids || []).map(aid => assetMap[aid]).filter(Boolean);
            
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
              photos: photos.length > 0 ? photos : [memory?.cover || '/images/goa-cover.png'],
              audioUrl: audioDetails.audio_url || `/static/audio/${seg.segment_id}.wav`,
              duration: audioDetails.duration_sec || 5.0
            };
          });
          setMoments(compiled);
        } else if (memory && memory.moments) {
          setMoments(memory.moments);
        }
      } catch (err) {
        console.warn("Failed to load relive data from backend, falling back to memory moments:", err);
        if (memory && memory.moments) setMoments(memory.moments);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, memory]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-memory-base flex items-center justify-center">
        <div className="text-center">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-violet-500 rounded-full mb-4"></span>
          <p className="text-memory-ivory-muted">Loading Relive Experience...</p>
        </div>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return (
      <div className="fixed inset-0 bg-memory-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-memory-ivory-muted mb-4">No moments to relive yet.</p>
          <Link to={`/memory/${memory.id}`} className="text-memory-lavender hover:underline">
            ← Back to memory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StoryPlayer moments={moments} memoryTitle={memory?.fullTitle} memoryId={memory?.id} />
  );
}
