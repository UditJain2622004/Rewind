import os
import json
import wave
import struct
import logging
import math
from typing import Dict, Any, List
from app.services.sarvam_service import SarvamService
from app.config import settings

logger = logging.getLogger(__name__)

MOOD_TTS_MAP = {
    "excited":   {"pace": 1.0, "temperature": 0.8},
    "warm":      {"pace": 1.0, "temperature": 0.55},
    "nostalgic": {"pace": 1.0, "temperature": 0.5},
    "funny":     {"pace": 1.0, "temperature": 0.9},
    "somber":    {"pace": 1.0, "temperature": 0.4},
    "neutral":   {"pace": 1.0, "temperature": 0.6}
}

class VideoService:
    def __init__(self):
        self.sarvam_service = SarvamService()
        
        # Paths
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        self.script_path = os.path.join(self.base_dir, "script.json")
        self.manifest_path = os.path.join(self.base_dir, "assets_manifest.json")
        
        # Output paths
        self.static_dir = os.path.join(self.base_dir, "backend", "static")
        self.audio_dir = os.path.join(self.static_dir, "audio")
        self.output_json_path = os.path.join(self.static_dir, "tts_output.json")

    def _create_mock_wav(self, file_path: str, text: str) -> float:
        """
        Creates a soft pulsing WAV sound file as a fallback in case the Sarvam AI API
        fails or is not configured. Returns the duration in seconds.
        """
        # Estimate duration based on text length (approx 12 characters per second, min 3s)
        duration = max(3.0, round(len(text) / 12.0, 2))
        sample_rate = 24000
        num_samples = int(sample_rate * duration)
        
        logger.info(f"Generating fallback mock WAV file at {file_path} (estimated duration: {duration}s)")
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Soft pulsing E4 tone (330Hz) at low/moderate volume
        frequency = 330.0
        amplitude = 8000
        
        with wave.open(file_path, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            
            for i in range(num_samples):
                # 2Hz pulse envelope (volume goes up and down softly)
                envelope = 0.5 + 0.5 * math.sin(2.0 * math.pi * 2.0 * i / sample_rate)
                val = int(amplitude * envelope * math.sin(2.0 * math.pi * frequency * i / sample_rate))
                wav_file.writeframesraw(struct.pack('<h', val))
                
        return duration

    def _get_wav_duration(self, file_path: str) -> float:
        """Helper to get WAV file duration in seconds."""
        with wave.open(file_path, 'rb') as wav_file:
            frames = wav_file.getnframes()
            rate = wav_file.getframerate()
            return round(frames / float(rate), 2)

    async def assemble_relive(self) -> Dict[str, Any]:
        """
        Loads script.json, generates TTS audio files for each segment,
        saves them statically, and produces the tts_output.json mapping.
        """
        logger.info("Starting Relive assembly...")
        
        # 1. Load script.json
        if not os.path.exists(self.script_path):
            raise FileNotFoundError(f"script.json not found at {self.script_path}")
            
        with open(self.script_path, "r", encoding="utf-8") as f:
            script_data = json.load(f)

        script_id = script_data.get("script_id", "unknown_script")
        speaker = script_data.get("speaker", "sumit")
        segments = script_data.get("segments", [])
        
        # Ensure static audio directory exists
        os.makedirs(self.audio_dir, exist_ok=True)
        
        audio_segments = []
        
        # 2. Process each segment
        for segment in segments:
            segment_id = segment.get("segment_id")
            narration_text = segment.get("narration_text", "")
            mood = segment.get("mood", "neutral")
            
            # Map mood to params
            mapped = MOOD_TTS_MAP.get(mood.lower(), {"pace": 1.0, "temperature": 1.0})
            pace = mapped["pace"]
            temp = mapped["temperature"]
            
            filename = f"{segment_id}.wav"
            file_path = os.path.join(self.audio_dir, filename)
            
            duration_sec = 0.0
            
            # Check if key is configured
            has_api_key = bool(settings.sarvam_api_key and settings.sarvam_api_key != "your_actual_sarvam_api_key_here")
            
            if not has_api_key:
                logger.warning("Sarvam API Key placeholder detected. Creating fallback mock audio.")
                duration_sec = self._create_mock_wav(file_path, narration_text)
            else:
                try:
                    import base64
                    logger.info(f"Requesting TTS for segment {segment_id} (mood: {mood}, pace: {pace}, temp: {temp})")
                    base64_audio, _ = await self.sarvam_service.text_to_speech(
                        text=narration_text,
                        speaker=speaker,
                        pace=pace,
                        temperature=temp
                    )
                    
                    # Write decoded bytes to static wav file
                    audio_bytes = base64.b64decode(base64_audio)
                    with open(file_path, "wb") as audio_file:
                        audio_file.write(audio_bytes)
                        
                    duration_sec = self._get_wav_duration(file_path)
                    logger.info(f"Segment {segment_id} saved successfully. Duration: {duration_sec}s")
                except Exception as e:
                    logger.error(f"Failed to generate TTS for segment {segment_id} via API: {e}. Falling back to mock audio.")
                    duration_sec = self._create_mock_wav(file_path, narration_text)

            audio_segments.append({
                "segment_id": segment_id,
                "audio_url": f"/static/audio/{filename}",
                "duration_sec": duration_sec,
                "mood": mood,
                "tts_params_used": {
                    "pace": pace,
                    "temperature": temp
                }
            })

        # 3. Create tts_output.json payload
        tts_output = {
            "script_id": script_id,
            "audio_segments": audio_segments,
            "full_audio_url": None
        }

        # 4. Save to static folder
        with open(self.output_json_path, "w", encoding="utf-8") as f:
            json.dump(tts_output, f, indent=2)
            
        logger.info(f"tts_output.json saved successfully to {self.output_json_path}")
        return tts_output

    def get_relive_data(self) -> Dict[str, Any]:
        """
        Combines script.json, assets_manifest.json, and tts_output.json
        into a unified object for simple frontend loading.
        """
        # Load script.json
        with open(self.script_path, "r", encoding="utf-8") as f:
            script_data = json.load(f)
            
        # Load assets_manifest.json
        with open(self.manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)

        # Load tts_output.json if it exists, else empty
        tts_output_data = {}
        if os.path.exists(self.output_json_path):
            with open(self.output_json_path, "r", encoding="utf-8") as f:
                tts_output_data = json.load(f)

        return {
            "script": script_data,
            "assets_manifest": manifest_data,
            "tts_output": tts_output_data
        }
