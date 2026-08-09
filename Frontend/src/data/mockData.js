// ============================================
// MOCK DATA — Realistic memory data
// ============================================

export const people = [
  { id: 'user', name: 'User', avatar: '👨🏽', color: '#f59e0b' }
];

export const memories = [];

export const exploreConversations = [];

export const suggestedQuestions = [
  'What was the funniest moment?',
  'Who was with us at the beach?',
  'What happened after dinner?',
  'Show me moments with Rahul',
  'Where did we get lost?',
  'What was our best day?',
];

export const storyFormats = [
  { id: 'reel', label: 'Instagram Reel', duration: '30–60 sec', icon: '📱' },
  { id: 'cinematic', label: 'Cinematic Story', duration: '1–3 min', icon: '🎬' },
  { id: 'photo', label: 'Photo Story', duration: '10–15 photos', icon: '📸' },
  { id: 'voice', label: 'Voice Story', duration: 'Narrated experience', icon: '🎙️' },
];

export const storyStyles = [
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'emotional', label: 'Emotional', emoji: '❤️' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'nostalgic', label: 'Nostalgic', emoji: '🌅' },
];

export const aiProcessingSteps = [
  { label: 'Understanding your experience...', delay: 800 },
  { label: '27 moments discovered', delay: 1200, icon: '✓' },
  { label: '43 photos connected', delay: 1600, icon: '✓' },
  { label: '6 voice notes understood', delay: 2000, icon: '✓' },
  { label: '5 people identified', delay: 2400, icon: '✓' },
  { label: 'Timeline reconstructed', delay: 2800, icon: '✓' },
  { label: 'Building your story...', delay: 3200 },
];

export const getAllMemories = () => {
  try {
    const custom = localStorage.getItem('rewind_user_created_memories');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.map((m) => {
          const photoItem = m.items?.find((i) =>
            (i.type === 'photo' || i.type === 'image' || i.preview || i.url || i.file_url) &&
            (i.file_url || i.url || i.preview) &&
            !i.type?.includes('voice') && !i.type?.includes('audio') && !i.type?.includes('text')
          );
          if (!m.cover || m.cover === '/images/goa-cover.png') {
            if (photoItem) {
              m.cover = photoItem.file_url || photoItem.url || photoItem.preview;
            }
          }
          if (!m.cover) {
            m.cover = '/images/goa-cover.png';
          }
          return m;
        });
        return [...cleaned, ...memories];
      }
    }
  } catch (e) {
    console.error("Error reading saved user memories:", e);
  }
  return memories;
};

export const saveUserMemory = (newMem) => {
  try {
    const existingStr = localStorage.getItem('rewind_user_created_memories');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const updated = [newMem, ...existing.filter(m => m.id !== newMem.id)];
    localStorage.setItem('rewind_user_created_memories', JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving user memory:", e);
  }
};
