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

        # Root paths
        # backend/app/services/ → backend/
        self.backend_dir = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        # backend/static/
        self.static_dir = os.path.join(self.backend_dir, "static")

        # Legacy paths (root-level script.json / assets_manifest.json kept for
        # backwards-compatibility with the IIM-B demo data).
        self._legacy_base = os.path.dirname(self.backend_dir)
        self._legacy_script = os.path.join(self._legacy_base, "script.json")
        self._legacy_manifest = os.path.join(self._legacy_base, "assets_manifest.json")

    # -----------------------------------------------------------------------
    # Path helpers (per-memory)
    # -----------------------------------------------------------------------

    def _exp_dir(self, memory_id: str) -> str:
        """Return (and create) the experience directory for a given memory_id."""
        path = os.path.join(self.static_dir, "experiences", memory_id)
        os.makedirs(path, exist_ok=True)
        return path

    def _resolve_script_path(self, memory_id: str) -> str:
        """
        Prefer  static/experiences/<memory_id>/scripts/relive_v1.json
        Fallback static/experiences/<memory_id>/relive_v1.json
        Fallback root script.json  (legacy IIM-B demo)
        """
        if memory_id:
            exp_dir = self._exp_dir(memory_id)
            candidates = [
                os.path.join(exp_dir, "scripts", "relive_v1.json"),
                os.path.join(exp_dir, "relive_v1.json"),
            ]
            for c in candidates:
                if os.path.exists(c):
                    return c
        return self._legacy_script

    def _resolve_manifest_path(self, memory_id: str) -> str:
        if memory_id:
            candidate = os.path.join(self._exp_dir(memory_id), "assets_manifest.json")
            if os.path.exists(candidate):
                return candidate
        return self._legacy_manifest

    def _resolve_audio_dir(self, memory_id: str) -> str:
        if memory_id:
            path = os.path.join(self._exp_dir(memory_id), "audio")
        else:
            path = os.path.join(self.static_dir, "audio")
        os.makedirs(path, exist_ok=True)
        return path

    def _resolve_output_json_path(self, memory_id: str) -> str:
        if memory_id:
            return os.path.join(self._exp_dir(memory_id), "tts_output.json")
        return os.path.join(self.static_dir, "tts_output.json")

    def _audio_url(self, memory_id: str, filename: str) -> str:
        if memory_id:
            return f"/static/experiences/{memory_id}/audio/{filename}"
        return f"/static/audio/{filename}"

    # -----------------------------------------------------------------------
    # WAV utilities
    # -----------------------------------------------------------------------

    def _create_mock_wav(self, file_path: str, text: str) -> float:
        duration = max(3.0, round(len(text) / 12.0, 2))
        sample_rate = 24000
        num_samples = int(sample_rate * duration)
        frequency = 330.0
        amplitude = 8000
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with wave.open(file_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            for i in range(num_samples):
                envelope = 0.5 + 0.5 * math.sin(2.0 * math.pi * 2.0 * i / sample_rate)
                val = int(amplitude * envelope * math.sin(2.0 * math.pi * frequency * i / sample_rate))
                wf.writeframesraw(struct.pack("<h", val))
        return duration

    def _get_wav_duration(self, file_path: str) -> float:
        with wave.open(file_path, "rb") as wf:
            return round(wf.getnframes() / float(wf.getframerate()), 2)

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------

    async def assemble_relive(self, memory_id: str = "") -> Dict[str, Any]:
        """
        Load a script (relive_v1.json or legacy script.json), generate TTS
        audio per segment, and write tts_output.json.
        """
        script_path = self._resolve_script_path(memory_id)
        if not os.path.exists(script_path):
            raise FileNotFoundError(
                f"Script not found for memory '{memory_id}'. "
                "Generate the AI story first via /api/memories/{id}/full-generate."
            )

        with open(script_path, "r", encoding="utf-8") as f:
            script_data = json.load(f)

        script_id = script_data.get("script_id", "unknown_script")
        speaker = script_data.get("speaker", "shubh")
        segments = script_data.get("segments", [])
        audio_dir = self._resolve_audio_dir(memory_id)
        output_json_path = self._resolve_output_json_path(memory_id)
        has_api_key = bool(
            settings.sarvam_api_key and settings.sarvam_api_key != "your_actual_sarvam_api_key_here"
        )

        audio_segments = []
        for segment in segments:
            segment_id = segment.get("segment_id")
            narration = segment.get("narration_text", "")
            mood = segment.get("mood", "neutral")
            mapped = MOOD_TTS_MAP.get(mood.lower(), {"pace": 1.0, "temperature": 1.0})
            filename = f"{segment_id}.wav"
            file_path = os.path.join(audio_dir, filename)
            duration_sec = 0.0

            if not has_api_key:
                logger.warning("No Sarvam API key — generating mock WAV for %s.", segment_id)
                duration_sec = self._create_mock_wav(file_path, narration)
            else:
                try:
                    import base64
                    b64, _ = await self.sarvam_service.text_to_speech(
                        text=narration,
                        speaker=speaker,
                        pace=mapped["pace"],
                        temperature=mapped["temperature"],
                    )
                    with open(file_path, "wb") as af:
                        af.write(base64.b64decode(b64))
                    duration_sec = self._get_wav_duration(file_path)
                    logger.info("TTS segment %s saved (%.1fs).", segment_id, duration_sec)
                except Exception as exc:
                    logger.error("TTS failed for %s: %s — using mock.", segment_id, exc)
                    duration_sec = self._create_mock_wav(file_path, narration)

            audio_segments.append({
                "segment_id": segment_id,
                "audio_url": self._audio_url(memory_id, filename),
                "duration_sec": duration_sec,
                "mood": mood,
                "tts_params_used": mapped,
            })

        tts_output = {
            "script_id": script_id,
            "audio_segments": audio_segments,
            "full_audio_url": None,
        }
        with open(output_json_path, "w", encoding="utf-8") as f:
            json.dump(tts_output, f, indent=2)

        logger.info("tts_output.json saved to %s", output_json_path)
        return tts_output

    def get_relive_data(self, memory_id: str = "") -> Dict[str, Any]:
        """
        Combine script, assets_manifest, and tts_output into a single payload
        for the frontend Relive player.
        """
        script_path = self._resolve_script_path(memory_id)
        manifest_path = self._resolve_manifest_path(memory_id)

        if not os.path.exists(script_path):
            raise FileNotFoundError(
                f"No script found for memory '{memory_id}'. Generate the AI story first."
            )

        with open(script_path, "r", encoding="utf-8") as f:
            script_data = json.load(f)
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)

        output_json_path = self._resolve_output_json_path(memory_id)
        tts_output = {}
        if os.path.exists(output_json_path):
            with open(output_json_path, "r", encoding="utf-8") as f:
                tts_output = json.load(f)

        return {
            "script": script_data,
            "assets_manifest": manifest_data,
            "tts_output": tts_output,
        }
