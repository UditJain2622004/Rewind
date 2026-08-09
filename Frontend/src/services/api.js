const API_BASE_URL = 'http://localhost:8000/api';

// ─────────────────────────────────────────────
// Asset Upload
// ─────────────────────────────────────────────

/**
 * Uploads media asset (photo/audio) to backend Cloudinary service.
 */
export async function uploadAssetToCloudinary(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

    const data = await response.json();
    const cdnUrl = data.file_url || data.url;
    return { ...data, url: cdnUrl, file_url: cdnUrl, preview: cdnUrl };
  } catch (error) {
    console.warn('Backend Cloudinary upload fallback:', error.message);
    const blobUrl = URL.createObjectURL(file);
    return {
      asset_id: Math.random().toString(36).slice(2),
      name: file.name,
      type: file.type.startsWith('image') ? 'photo' : 'voice',
      url: blobUrl,
      file_url: blobUrl,
      preview: blobUrl,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };
  }
}

// ─────────────────────────────────────────────
// Draft Management
// ─────────────────────────────────────────────

/**
 * Saves active memory draft to MongoDB.
 */
export async function saveDraftToMongoDB(draftData) {
  try {
    const response = await fetch(`${API_BASE_URL}/memories/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftData),
    });

    if (!response.ok) throw new Error(`Failed to save draft: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.warn('Backend MongoDB draft save fallback to localStorage:', error.message);
    localStorage.setItem('rewind_active_memory_draft', JSON.stringify(draftData));
    return { status: 'fallback', draft: draftData };
  }
}

/**
 * Fetches active draft memory from MongoDB.
 */
export async function getDraftFromMongoDB(memoryId = null) {
  try {
    const url = memoryId
      ? `${API_BASE_URL}/memories/draft?memory_id=${memoryId}`
      : `${API_BASE_URL}/memories/draft`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch draft');
    const data = await response.json();
    if (data.draft) return data.draft;
  } catch (error) {
    console.warn('Backend MongoDB fetch fallback to localStorage:', error.message);
  }
  const local = localStorage.getItem('rewind_active_memory_draft');
  return local ? JSON.parse(local) : null;
}

/**
 * Triggers memory vault generation in MongoDB (status transition only).
 */
export async function triggerMemoryGeneration(memoryId) {
  try {
    const response = await fetch(`${API_BASE_URL}/memories/${memoryId}/generate`, {
      method: 'POST',
    });
    return await response.json();
  } catch (error) {
    console.warn('Generation fallback:', error);
    return { memory_id: memoryId, status: 'processing' };
  }
}

// ─────────────────────────────────────────────
// Full Pipeline — SSE streaming
// ─────────────────────────────────────────────

/**
 * Triggers the full AI pipeline for a memory and streams progress via SSE.
 *
 * @param {string} memoryId
 * @param {function} onProgress  — called with ({ step, progress }) during generation
 * @returns {Promise<object>}    — resolves with the final result object
 */
export function runFullPipeline(memoryId, onProgress) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/memories/${encodeURIComponent(memoryId)}/full-generate`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.error) {
          eventSource.close();
          reject(new Error(payload.error));
        } else if (payload.done) {
          eventSource.close();
          resolve(payload.result);
        } else if (payload.step !== undefined) {
          onProgress && onProgress(payload);
        }
      } catch (err) {
        console.warn('SSE parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
      reject(new Error('Pipeline connection lost. Check the backend is running.'));
    };
  });
}

// ─────────────────────────────────────────────
// Memories List (Dashboard)
// ─────────────────────────────────────────────

/**
 * Fetches all memories from MongoDB (for the Dashboard).
 */
export async function getAllMemoriesFromDB() {
  try {
    const response = await fetch(`${API_BASE_URL}/memory-list`);
    if (!response.ok) throw new Error('Failed to fetch memories');
    const data = await response.json();
    return data.memories || [];
  } catch (error) {
    console.warn('Could not fetch memories from backend:', error.message);
    return [];
  }
}

export const getAllMemoriesFromMongoDB = getAllMemoriesFromDB;
export const getAllMemoriesFromAPI = getAllMemoriesFromDB;

// ─────────────────────────────────────────────
// Explore / Q&A
// ─────────────────────────────────────────────

/**
 * Ask the AI assistant a question about a memory.
 * @param {string} query
 * @param {string} memoryId
 */
export async function askMemoryQuestion(query, memoryId = '') {
  try {
    const params = new URLSearchParams({ query });
    if (memoryId) params.set('memory_id', memoryId);
    const response = await fetch(`${API_BASE_URL}/explore?${params}`);
    if (!response.ok) throw new Error('Explore API error');
    return await response.json();
  } catch (error) {
    console.warn('Explore API fallback:', error.message);
    return { query, answer: 'The AI assistant is temporarily unavailable. Please try again.', grounded: false };
  }
}

export const exploreMemory = (query) => askMemoryQuestion(query);

// ─────────────────────────────────────────────
// Relive Player Data
// ─────────────────────────────────────────────

/**
 * Fetch unified relive timeline data (script + assets + tts_output).
 * @param {string} memoryId
 */
export async function getReliveData(memoryId = '') {
  const params = memoryId ? `?memory_id=${encodeURIComponent(memoryId)}` : '';
  const response = await fetch(`${API_BASE_URL}/relive-data${params}`);
  if (!response.ok) throw new Error(`Relive data fetch failed: ${response.statusText}`);
  return await response.json();
}

/**
 * Trigger TTS assembly for a memory's relive script.
 * @param {string} memoryId
 */
export async function assembleRelive(memoryId = '') {
  const params = memoryId ? `?memory_id=${encodeURIComponent(memoryId)}` : '';
  const response = await fetch(`${API_BASE_URL}/assemble-relive${params}`, { method: 'POST' });
  if (!response.ok) throw new Error(`Assemble failed: ${response.statusText}`);
  return await response.json();
}
