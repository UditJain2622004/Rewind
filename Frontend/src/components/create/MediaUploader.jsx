import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  Mic,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  FileUp,
  Plus
} from 'lucide-react';
import { uploadAssetToCloudinary } from '../../services/api';

const sampleMoments = [
  {
    id: 'ast_0001',
    name: 'General_Coach_Arrival.jpg',
    type: 'photo',
    size: '2.4 MB',
    preview: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251613/WhatsApp_Image_2026-08-09_at_10.15.58_1_bo6co1.jpg',
    url: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251613/WhatsApp_Image_2026-08-09_at_10.15.58_1_bo6co1.jpg',
    description: 'Ankush & Rohit dead tired after overnight general coach train ride to Bangalore'
  },
  {
    id: 'ast_0002',
    name: 'Udit_Fresh_Arrival.jpg',
    type: 'photo',
    size: '3.1 MB',
    preview: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251799/pro-image-1786251775267_bplipq.jpg',
    url: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251799/pro-image-1786251775267_bplipq.jpg',
    description: 'Udit strolling in fresh, since he already lives in Bangalore'
  },
  {
    id: 'ast_0003',
    name: 'IIMB_Logo_Prank.jpg',
    type: 'photo',
    size: '2.8 MB',
    preview: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251642/WhatsApp_Image_2026-08-09_at_10.17.41_aoh10n.jpg',
    url: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251642/WhatsApp_Image_2026-08-09_at_10.17.41_aoh10n.jpg',
    description: 'Pic with the IIM B logo to prank the class group chat about getting admission'
  },
  {
    id: 'ast_0005',
    name: '3_Idiots_Water_Tank.jpg',
    type: 'photo',
    size: '3.5 MB',
    preview: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251631/WhatsApp_Image_2026-08-09_at_10.17.40_jnaqyq.jpg',
    url: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251631/WhatsApp_Image_2026-08-09_at_10.17.40_jnaqyq.jpg',
    description: 'The famous water tank from 3 Idiots movie on IIM B campus'
  },
  {
    id: 'ast_0007',
    name: '3_Idiots_Butt_Chairs_Night.jpg',
    type: 'photo',
    size: '4.0 MB',
    preview: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251631/WhatsApp_Image_2026-08-09_at_10.17.41_1_rwduko.jpg',
    url: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251631/WhatsApp_Image_2026-08-09_at_10.17.41_1_rwduko.jpg',
    description: 'Night shots on the famous butt chairs before heading to hotel'
  },
  {
    id: 'ast_0009',
    name: 'Rohit_Dozed_Off.jpg',
    type: 'photo',
    size: '3.2 MB',
    preview: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251634/WhatsApp_Image_2026-08-09_at_10.17.42_wgfkrh.jpg',
    url: 'https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251634/WhatsApp_Image_2026-08-09_at_10.17.42_wgfkrh.jpg',
    description: 'Rohit completely dozed off on a chair mid-hackathon coding sprint'
  },
  {
    id: 'ast_0050',
    name: 'Rohit_Arrival_Story.mp3',
    type: 'voice',
    size: '1.5 MB',
    duration: '0:38',
    preview: null,
    url: 'https://res.cloudinary.com/dynoxkmjy/video/upload/v1786251576/1_cifmrt.mp3',
    description: 'Rohit recording voice note about train journey to IIM Bangalore'
  },
  {
    id: 'ast_0051',
    name: 'Udit_Night_Building_Voice.mp3',
    type: 'voice',
    size: '1.8 MB',
    duration: '0:45',
    preview: null,
    url: 'https://res.cloudinary.com/dynoxkmjy/video/upload/v1786251575/2_qjwofi.mp3',
    description: 'Udit talking about the late night coding session'
  }
];

export default function MediaUploader({ initialItems = [], onItemsChanged }) {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'audio' | 'text'
  const [dragActive, setDragActive] = useState(false);
  const [items, setItems] = useState(initialItems);
  
  // Direct text note typing state
  const [directTextNote, setDirectTextNote] = useState('');
  
  // Real Web Audio Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordTimerInterval, setRecordTimerInterval] = useState(null);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const notifyParent = (newItems) => {
    setItems(newItems);
    setTimeout(() => {
      onItemsChanged?.(newItems);
    }, 0);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(Array.from(e.dataTransfer.files));
    }
  };

  const processFileList = async (fileList) => {
    for (const file of fileList) {
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isText = file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md');

      if (isText) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const textContent = event.target.result;
          const textItem = {
            id: Math.random().toString(36).slice(2),
            name: file.name,
            type: 'text',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            preview: null,
            description: textContent
          };
          setItems((prev) => {
            const updated = [...prev, textItem];
            onItemsChanged?.(updated);
            return updated;
          });
        };
        reader.readAsText(file);
      } else {
        // Upload to Cloudinary backend service
        const uploadResult = await uploadAssetToCloudinary(file);
        const cdnUrl = uploadResult.file_url || uploadResult.url;
        const item = {
          id: uploadResult.asset_id || Math.random().toString(36).slice(2),
          name: file.name,
          type: isImage ? 'photo' : isAudio ? 'voice' : 'other',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          preview: cdnUrl || URL.createObjectURL(file),
          url: cdnUrl || URL.createObjectURL(file),
          file_url: cdnUrl || URL.createObjectURL(file),
          description: ''
        };

        setItems((prev) => {
          const updated = [...prev, item];
          onItemsChanged?.(updated);
          return updated;
        });
      }
    }
  };

  const updateDescription = (id, newDesc) => {
    const updated = items.map((it) => (it.id === id ? { ...it, description: newDesc } : it));
    notifyParent(updated);
  };

  const removeItem = (id) => {
    const updated = items.filter((it) => it.id !== id);
    notifyParent(updated);
  };

  const handleAddDirectTextNote = () => {
    if (!directTextNote.trim()) return;
    const textItem = {
      id: Math.random().toString(36).slice(2),
      name: `Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.txt`,
      type: 'text',
      size: `${(directTextNote.length / 1024).toFixed(1)} KB`,
      preview: null,
      description: directTextNote
    };
    notifyParent([...items, textItem]);
    setDirectTextNote('');
  };

  // Real Microphone Recording using Web Audio API MediaRecorder
  const handleToggleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Optional upload to backend Cloudinary service
          const audioFile = new File([audioBlob], `Live_Voice_${Date.now().toString().slice(-4)}.mp3`, { type: 'audio/mp3' });
          const uploadRes = await uploadAssetToCloudinary(audioFile);
          const cdnVoiceUrl = uploadRes.file_url || uploadRes.url;

          const recordedObj = {
            id: uploadRes.asset_id || `voice-${Date.now()}`,
            name: `Live_Voice_Note_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.mp3`,
            type: 'voice',
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            duration: `${recordTime}s`,
            preview: cdnVoiceUrl || audioUrl,
            url: cdnVoiceUrl || audioUrl,
            file_url: cdnVoiceUrl || audioUrl,
            description: ''
          };

          notifyParent([...items, recordedObj]);
          
          // Stop stream tracks to release microphone
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordTime(0);

        const timer = setInterval(() => {
          setRecordTime((t) => t + 1);
        }, 1000);
        setRecordTimerInterval(timer);

      } catch (err) {
        console.error('Microphone access error:', err);
        alert('Could not access microphone. Please allow microphone permission in your browser.');
      }
    } else {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (recordTimerInterval) {
        clearInterval(recordTimerInterval);
      }
      setIsRecording(false);
    }
  };

  const loadSamples = () => {
    notifyParent(sampleMoments);
  };

  const photoItems = items.filter((it) => it.type === 'photo');
  const audioItems = items.filter((it) => it.type === 'voice');
  const textItems = items.filter((it) => it.type === 'text');

  return (
    <div className="space-y-4">
      {/* Category Tab Switcher */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-[#18181f] rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'photos'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ImageIcon size={14} className="text-amber-400" />
            <span>Photos ({photoItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'audio'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Mic size={14} className="text-emerald-400" />
            <span>Audio ({audioItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'text'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FileText size={14} className="text-sky-400" />
            <span>Text & Notes ({textItems.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadSamples}
          className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-400/30 text-violet-300 text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <Sparkles size={13} className="text-amber-400" />
          <span>Load Demo Samples</span>
        </button>
      </div>

      {/* TAB CONTENT 1: PHOTOS */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => processFileList(Array.from(e.target.files))}
            />
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all bg-[#141418]/80 hover:bg-[#18181f] ${
                dragActive ? 'border-amber-400 bg-amber-500/10' : 'border-white/15'
              }`}
            >
              <Upload size={22} className="mx-auto text-amber-400 mb-2" />
              <p className="text-xs font-semibold text-white">Click or drag photos here to upload</p>
              <p className="text-[11px] text-white/50 mt-0.5">Supports JPG, PNG, WEBP, HEIC</p>
            </div>
          </label>

          {photoItems.length > 0 && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {photoItems.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#18181e] border border-white/10 group hover:border-amber-400/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/10 relative">
                    {photo.preview ? (
                      <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{photo.name}</span>
                      <div className="flex items-center gap-2">
                        {photo.description && photo.description.trim().length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Saved
                          </span>
                        )}
                        <span className="text-[10px] text-white/40 font-mono">{photo.size}</span>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={photo.description || ''}
                      onChange={(e) => updateDescription(photo.id, e.target.value)}
                      placeholder="Type description for this photo (e.g. Who was there, what happened)..."
                      className="w-full bg-[#101014] border border-white/10 focus:border-amber-400/80 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(photo.id)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: AUDIO */}
      {activeTab === 'audio' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => processFileList(Array.from(e.target.files))}
              />
              <div className="border border-white/15 rounded-2xl p-4 text-center bg-[#141418] hover:bg-[#18181f] transition-all">
                <Mic size={20} className="mx-auto text-emerald-400 mb-1.5" />
                <p className="text-xs font-semibold text-white">Upload Audio Files</p>
                <p className="text-[10px] text-white/40 mt-0.5">MP3, WAV, M4A, AAC</p>
              </div>
            </label>

            <button
              type="button"
              onClick={handleToggleRecord}
              className={`flex-1 border rounded-2xl p-4 text-center transition-all ${
                isRecording
                  ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                  : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300'
              }`}
            >
              <Mic size={20} className="mx-auto mb-1.5" />
              <p className="text-xs font-semibold flex items-center justify-center gap-1.5">
                <Mic size={14} className="text-emerald-400" />
                <span>{isRecording ? `Recording... (${recordTime}s)` : 'Record Voice Note'}</span>
              </p>
              <p className="text-[10px] opacity-70 mt-0.5">Instant live mic capture</p>
            </button>
          </div>

          {audioItems.length > 0 && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {audioItems.map((audio) => (
                <div
                  key={audio.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#18181e] border border-white/10 group hover:border-emerald-400/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Mic size={20} className="text-emerald-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{audio.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{audio.duration || audio.size}</span>
                    </div>

                    {/* Audio Playback & Voice Check Player */}
                    {(audio.url || audio.preview) && (
                      <div className="pt-0.5">
                        <audio
                          src={audio.url || audio.preview}
                          controls
                          className="h-7 w-full max-w-[240px] opacity-90 rounded-lg"
                        />
                      </div>
                    )}

                    <input
                      type="text"
                      value={audio.description || ''}
                      onChange={(e) => updateDescription(audio.id, e.target.value)}
                      placeholder="Add audio description (optional)..."
                      className="w-full bg-[#101014] border border-white/10 focus:border-emerald-400/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(audio.id)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: TEXT & NOTES */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          {/* Direct Text Typing Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <MessageSquare size={13} className="text-sky-400" />
                <span>Write Story Notes & Context</span>
              </label>
              <label className="cursor-pointer text-[11px] text-sky-300 hover:text-sky-200 flex items-center gap-1">
                <FileUp size={12} />
                <span>Upload .txt File</span>
                <input
                  type="file"
                  accept=".txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) processFileList(Array.from(e.target.files));
                  }}
                />
              </label>
            </div>

            <textarea
              rows={3}
              value={directTextNote}
              onChange={(e) => setDirectTextNote(e.target.value)}
              placeholder="Type any memory details, quotes, or story notes here..."
              className="w-full bg-[#141418] border border-white/10 focus:border-sky-400 rounded-2xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors resize-none"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddDirectTextNote}
                disabled={!directTextNote.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition-all"
              >
                <Plus size={14} />
                <span>Add Note to Memory</span>
              </button>
            </div>
          </div>

          {textItems.length > 0 && (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {textItems.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-2xl bg-[#18181e] border border-white/10 space-y-1 group hover:border-sky-400/40 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <FileText size={13} className="text-sky-400" />
                      {note.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(note.id)}
                      className="text-white/40 hover:text-rose-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-3 bg-[#101014] p-2 rounded-xl border border-white/5 font-mono">
                    {note.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vault Summary Indicator */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <CheckCircle2 size={14} />
          {items.length} total items in story vault
        </span>
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
            <ImageIcon size={12} /> {photoItems.length} photos
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
            <Mic size={12} /> {audioItems.length} audio
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 font-medium">
            <FileText size={12} /> {textItems.length} notes
          </span>
        </div>
      </div>
    </div>
  );
}
