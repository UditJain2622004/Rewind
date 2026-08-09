const API_BASE_URL = 'http://localhost:8000/api';

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

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    const cdnUrl = data.file_url || data.url;
    return {
      ...data,
      url: cdnUrl,
      file_url: cdnUrl,
      preview: cdnUrl
    };
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

/**
 * Saves active memory draft to MongoDB.
 */
export async function saveDraftToMongoDB(draftData) {
  try {
    const response = await fetch(`${API_BASE_URL}/memories/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save draft: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Backend MongoDB draft save fallback to localStorage:', error.message);
    // Local storage fallback if backend server is not running
    localStorage.setItem('rewind_active_memory_draft', JSON.stringify(draftData));
    return { status: 'fallback', draft: draftData };
  }
}

/**
 * Fetches active draft memory from MongoDB.
 */
export async function getDraftFromMongoDB(memoryId = null) {
  try {
    const url = memoryId ? `${API_BASE_URL}/memories/draft?memory_id=${memoryId}` : `${API_BASE_URL}/memories/draft`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch draft');

    const data = await response.json();
    if (data.draft) return data.draft;
  } catch (error) {
    console.warn('Backend MongoDB fetch fallback to localStorage:', error.message);
  }

  // Fallback to local storage
  const local = localStorage.getItem('rewind_active_memory_draft');
  return local ? JSON.parse(local) : null;
}

/**
 * Fetches all memories from MongoDB Atlas database.
 */
export async function getAllMemoriesFromMongoDB() {
  try {
    const response = await fetch(`${API_BASE_URL}/memories`);
    if (!response.ok) throw new Error('Failed to fetch memories from MongoDB');

    const data = await response.json();
    if (data.memories && Array.isArray(data.memories)) {
      return data.memories;
    }
  } catch (error) {
    console.warn('Backend MongoDB memories fetch warning/fallback:', error.message);
  }
  return null;
}

/**
 * Triggers memory vault generation in MongoDB.
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

/**
 * Triggers audio timeline and speech compilation for the Relive experience.
 */
export async function assembleRelive() {
  try {
    const response = await fetch(`${API_BASE_URL}/assemble-relive`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Assembly failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API assembleRelive error:', error);
    throw error;
  }
}

/**
 * Fetches compiled relive visual timelines and segment details from backend.
 */
export async function getReliveData() {
  try {
    const response = await fetch(`${API_BASE_URL}/relive-data`);
    if (!response.ok) {
      throw new Error(`Fetching relive data failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API getReliveData error:', error);
    throw error;
  }
}

/**
 * Queries the unified AI explore engine about a memory.
 */
export async function exploreMemory(query) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/explore?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      throw new Error(`Explore search failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API exploreMemory error:', error);
    throw error;
  }
}

/**
 * Fetches all memory stories from backend API with fallback support.
 */
export async function getAllMemoriesFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/memories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch memories: ${response.statusText}`);
    }
    const data = await response.json();
    if (data && data.memories) {
      return data.memories;
    }
  } catch (error) {
    console.warn('Backend API memories fetch fallback to local:', error.message);
  }
  const { getAllMemories } = await import('../data/mockData');
  return getAllMemories();
}


