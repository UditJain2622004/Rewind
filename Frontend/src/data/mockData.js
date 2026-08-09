// ============================================
// MOCK DATA — Realistic memory data
// ============================================

export const people = [
  { id: 'rahul', name: 'Rahul', avatar: '👨🏽', color: '#a78bfa' },
  { id: 'priya', name: 'Priya', avatar: '👩🏽', color: '#f472b6' },
  { id: 'udit', name: 'Udit', avatar: '👨🏻', color: '#38bdf8' },
  { id: 'ankush', name: 'Ankush', avatar: '👨🏽', color: '#f59e0b' },
  { id: 'neha', name: 'Neha', avatar: '👩🏻', color: '#34d399' },
];

export const memories = [
  {
    id: 'goa-july-2026',
    title: 'Goa',
    subtitle: 'July 2026',
    fullTitle: 'Goa — July 2026',
    cover: '/images/goa-cover.png',
    stats: { people: 5, days: 3, moments: 47 },
    description: '5 friends • 3 days • 47 moments',
    contributors: [
      { ...people[0], photos: 12, voiceNotes: 2 },
      { ...people[1], photos: 9, voiceNotes: 3 },
      { ...people[2], photos: 18, voiceNotes: 1 },
      { ...people[3], photos: 5, voiceNotes: 2 },
      { ...people[4], photos: 3, voiceNotes: 0 },
    ],
    moments: [
      {
        id: 'm1',
        time: '09:42 AM',
        location: 'Baga Beach',
        emoji: '☀️',
        description: 'We started the day at Baga Beach',
        aiNarration: 'Everyone was still fresh and excited. The morning sun painted everything in gold.',
        photos: ['/images/beach-moment.png'],
        voiceNote: null,
        people: ['rahul', 'priya', 'udit', 'ankush', 'neha'],
        day: 1,
      },
      {
        id: 'm2',
        time: '11:15 AM',
        location: 'North Goa Road',
        emoji: '🛺',
        description: 'The wrong turn that changed everything',
        aiNarration: 'Somehow, a wrong turn became the best part of the day. Nobody complained.',
        photos: ['/images/road-trip.png'],
        voiceNote: { duration: '0:34', transcript: 'We intentionally took the wrong road.' },
        people: ['rahul', 'udit'],
        day: 1,
      },
      {
        id: 'm3',
        time: '02:17 PM',
        location: 'Hidden Beach',
        emoji: '🏝️',
        description: 'Accidentally discovered a hidden beach',
        aiNarration: "We didn't plan to find this beach. That's probably why it became our favorite part of the trip.",
        photos: ['/images/hidden-beach.png'],
        voiceNote: { duration: '1:12', transcript: 'We were completely lost 😂' },
        people: ['rahul', 'priya', 'udit', 'ankush', 'neha'],
        day: 1,
      },
      {
        id: 'm4',
        time: '06:30 PM',
        location: 'Anjuna Beach',
        emoji: '🌅',
        description: 'Sunset that nobody wanted to end',
        aiNarration: 'For ten minutes, nobody said a word. The sunset was doing all the talking.',
        photos: ['/images/goa-cover.png'],
        voiceNote: null,
        people: ['priya', 'neha', 'ankush'],
        day: 1,
      },
      {
        id: 'm5',
        time: '08:43 PM',
        location: 'Thalassa Restaurant',
        emoji: '🍜',
        description: 'The restaurant nobody planned to visit',
        aiNarration: 'A random recommendation from a local turned into the best meal of the trip.',
        photos: ['/images/dinner-moment.png'],
        voiceNote: { duration: '0:22', transcript: 'This food is insane, we need to come back here.' },
        people: ['rahul', 'priya', 'udit', 'ankush', 'neha'],
        day: 1,
      },
      {
        id: 'm6',
        time: '07:00 AM',
        location: 'Palolem Beach',
        emoji: '🏊',
        description: 'Early morning swim',
        aiNarration: 'Only Rahul and Udit woke up early enough. The beach was completely empty.',
        photos: ['/images/beach-moment.png'],
        voiceNote: null,
        people: ['rahul', 'udit'],
        day: 2,
      },
      {
        id: 'm7',
        time: '04:00 PM',
        location: 'Dudhsagar Falls',
        emoji: '🌊',
        description: 'The waterfall adventure',
        aiNarration: 'Three hours of bumpy roads. Completely worth it.',
        photos: ['/images/hidden-beach.png'],
        voiceNote: { duration: '0:45', transcript: 'This is the most beautiful thing I have ever seen.' },
        people: ['rahul', 'priya', 'udit', 'ankush', 'neha'],
        day: 2,
      },
    ],
    perspectives: [
      {
        momentId: 'm2',
        views: [
          { person: people[0], quote: 'We intentionally took the wrong road.' },
          { person: people[1], quote: 'We were completely lost 😂' },
        ],
        aiSummary: 'The group remembers the detour differently.',
      },
    ],
  },
  {
    id: 'college-farewell-2026',
    title: 'College Farewell',
    subtitle: 'May 2026',
    fullTitle: 'College Farewell — May 2026',
    cover: '/images/college-farewell.png',
    stats: { people: 12, days: 1, moments: 34 },
    description: '12 friends • 1 unforgettable night • 34 moments',
    contributors: [],
    moments: [],
    perspectives: [],
  },
  {
    id: 'birthday-2026',
    title: 'Birthday 2026',
    subtitle: 'March 2026',
    fullTitle: 'Birthday — March 2026',
    cover: '/images/birthday-cover.png',
    stats: { people: 8, days: 1, moments: 22 },
    description: '8 friends • 1 surprise • 22 moments',
    contributors: [],
    moments: [],
    perspectives: [],
  },
  {
    id: 'bangalore-weekend',
    title: 'Bangalore Weekend',
    subtitle: 'June 2026',
    fullTitle: 'Bangalore Weekend — June 2026',
    cover: '/images/bangalore-cover.png',
    stats: { people: 3, days: 2, moments: 18 },
    description: '3 friends • 2 days • 18 moments',
    contributors: [],
    moments: [],
    perspectives: [],
  },
  {
    id: 'family-wedding',
    title: 'Family Wedding',
    subtitle: 'April 2026',
    fullTitle: 'Family Wedding — April 2026',
    cover: '/images/wedding-cover.png',
    stats: { people: 25, days: 3, moments: 67 },
    description: '25 family members • 3 days • 67 moments',
    contributors: [],
    moments: [],
    perspectives: [],
  },
];

export const exploreConversations = [
  {
    question: 'What was the funniest thing that happened?',
    answer: "Rahul lost his slippers while everyone was trying to find the hidden beach. He walked barefoot for the rest of the day and somehow didn't mind.",
    relatedPhoto: '/images/hidden-beach.png',
    momentId: 'm3',
  },
  {
    question: 'Who was with us at the beach?',
    answer: 'Everyone was at Baga Beach in the morning — Rahul, Priya, Udit, Ankush, and Neha. But only Rahul and Udit made it to the early morning swim at Palolem on day 2.',
    relatedPhoto: '/images/beach-moment.png',
    momentId: 'm1',
  },
  {
    question: 'What happened after dinner?',
    answer: "After dinner at Thalassa, the group walked along the beach for almost an hour. Priya recorded a voice note saying it was the most peaceful night she'd had in months.",
    relatedPhoto: '/images/dinner-moment.png',
    momentId: 'm5',
  },
  {
    question: 'Show me moments with Rahul',
    answer: 'Rahul appears in 5 out of 7 key moments. He was especially present during the wrong turn adventure and the hidden beach discovery. He also recorded 2 voice notes.',
    relatedPhoto: '/images/road-trip.png',
    momentId: 'm2',
  },
  {
    question: 'Where did we get lost?',
    answer: "The group took a wrong turn on the North Goa Road around 11:15 AM on Day 1. What started as a mistake led to the discovery of a hidden beach that became everyone's favorite spot.",
    relatedPhoto: '/images/hidden-beach.png',
    momentId: 'm2',
  },
  {
    question: 'What was our best day?',
    answer: 'Day 1 was the most memorable with 5 key moments including the beach, the famous wrong turn, the hidden beach discovery, a stunning sunset at Anjuna, and dinner at Thalassa.',
    relatedPhoto: '/images/goa-cover.png',
    momentId: 'm1',
  },
];

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
        return [...parsed, ...memories];
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
