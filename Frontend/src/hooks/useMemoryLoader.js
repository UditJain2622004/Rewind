import { useState, useEffect } from 'react';
import { memories, getAllMemories } from '../data/mockData';
import { getDraftFromMongoDB } from '../services/api';

export function formatMemoryData(id, rawData) {
  if (!rawData) {
    const mockMatch = memories.find((m) => m.id === id);
    if (mockMatch) return mockMatch;
    if (memories[0]) return memories[0];
    return {
      id: id || 'demo',
      title: 'Memory Vault Story',
      subtitle: 'Vault Story',
      fullTitle: 'Memory Vault Story',
      cover: '/images/goa-cover.png',
      stats: { people: 1, days: 1, moments: 0 },
      description: 'Moments saved in memory vault.',
      contributors: [],
      moments: []
    };
  }

  const titleText = rawData.title || rawData.name || 'Memory Vault Story';
  const fullTitleText = rawData.fullTitle || `${titleText} — ${rawData.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

  // Convert raw items into timeline moments if not already formatted
  let moments = rawData.moments || [];
  if ((!moments || moments.length === 0) && rawData.items && rawData.items.length > 0) {
    moments = rawData.items.map((item, idx) => {
      const isVoice = item.type === 'voice' || item.type === 'voice_note' || item.type === 'audio';
      const isText = item.type === 'text' || item.type === 'text_note';
      const isImage = item.type === 'photo' || item.type === 'image' || (!isVoice && !isText);
      const itemUrl = item.file_url || item.url || item.preview;

      return {
        id: item.asset_id || item.id || `m_${idx}`,
        time: item.uploaded_at
          ? new Date(item.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : `${10 + idx}:00 AM`,
        location: item.location || 'Memory Vault',
        emoji: isImage ? '📸' : isVoice ? '🎙️' : '📝',
        description: item.user_caption || item.description || item.name || (isImage ? 'Photo Moment' : isVoice ? 'Voice Note' : 'Memory Note'),
        aiNarration: item.aiNarration || (isText ? (item.description || item.user_caption) : null),
        photos: isImage && itemUrl ? [itemUrl] : [],
        voiceNote: isVoice && itemUrl ? {
          duration: item.duration || '0:30',
          transcript: item.user_caption || item.description || 'Voice Recording',
          url: itemUrl
        } : null,
        day: 1,
        people: ['ankush']
      };
    });
  }

  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('test.jpg') || url.endsWith('/test.jpg')) return false;
    return true;
  };

  // Cover image selection
  let cover = isValidImageUrl(rawData.cover) ? rawData.cover : null;
  const photoItem = rawData.items?.find((i) => {
    const isVoice = i.type === 'voice' || i.type === 'voice_note' || i.type === 'audio';
    const isText = i.type === 'text' || i.type === 'text_note';
    const itemUrl = i.file_url || i.url || i.preview;
    return !isVoice && !isText && isValidImageUrl(itemUrl);
  });
  const momentPhoto = moments?.find((m) => m.photos && m.photos.length > 0 && isValidImageUrl(m.photos[0]))?.photos[0];

  if (!cover || cover === '/images/goa-cover.png') {
    if (photoItem) {
      cover = photoItem.file_url || photoItem.url || photoItem.preview;
    } else if (momentPhoto) {
      cover = momentPhoto;
    }
  }

  if (!cover || !isValidImageUrl(cover)) {
    cover = '/images/goa-cover.png';
  }

  return {
    id: rawData.id || rawData.memory_id || id,
    title: titleText,
    subtitle: rawData.subtitle || titleText,
    fullTitle: fullTitleText,
    cover: cover,
    stats: rawData.stats || { people: 1, days: 1, moments: moments.length || 1 },
    description: rawData.description || `${moments.length} moments saved in memory vault.`,
    contributors: rawData.contributors || [
      { id: 'ankush', name: 'Ankush', avatar: '👨🏽', color: '#f59e0b', photos: moments.filter(m => m.photos?.length > 0).length, voiceNotes: moments.filter(m => m.voiceNote).length }
    ],
    moments: moments,
    items: rawData.items || []
  };
}

export function useMemoryLoader(id) {
  const [memory, setMemory] = useState(() => {
    const allMems = getAllMemories();
    const found = allMems.find((m) => m.id === id);
    if (found) return formatMemoryData(id, found);
    const mock = memories.find((m) => m.id === id) || memories[0];
    return formatMemoryData(id, mock);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const allMems = getAllMemories();
    const localMatch = allMems.find((m) => m.id === id);
    if (localMatch && isMounted) {
      setMemory(formatMemoryData(id, localMatch));
    }

    // Try fetching live data from MongoDB if applicable
    getDraftFromMongoDB(id)
      .then((dbData) => {
        if (!isMounted) return;
        if (dbData) {
          const dbId = dbData.id || dbData._id || dbData.memory_id;
          if (dbId === id || (!localMatch && dbData.items?.length > 0)) {
            const merged = localMatch ? { ...localMatch, ...dbData } : dbData;
            const formatted = formatMemoryData(id, merged);
            if (localMatch?.cover && localMatch.cover !== '/images/goa-cover.png') {
              formatted.cover = localMatch.cover;
            }
            setMemory(formatted);
          }
        }
      })
      .catch((err) => {
        console.warn('Error fetching memory from MongoDB:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { memory, loading };
}
