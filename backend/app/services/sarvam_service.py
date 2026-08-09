import logging
from typing import Dict, Any, Tuple, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Recommended high-performing Tier 1 & Tier 2 speakers for bulbul:v3
# based on measured Critical Error Rate (CER).
LANGUAGE_BEST_SPEAKER_MAP = {
    "hi-IN": "ritu",       # Clear female Hindi voice (shubh is default male)
    "en-IN": "mani",       # Perfect English voice (0.00% Critical Error Rate)
    "bn-IN": "pooja",      # Highly articulate female Bengali voice
    "ta-IN": "priya",      # High-performance female Tamil voice (0.13% CER)
    "te-IN": "priya",      # Fluent female Telugu voice (0.13% CER)
    "kn-IN": "roopa",      # Clear female Kannada voice
    "ml-IN": "roopa",      # Clear female Malayalam voice
    "mr-IN": "pooja",      # Fluent female Marathi voice
    "gu-IN": "neha",       # Clear female Gujarati voice
    "pa-IN": "amit",       # Clear male Punjabi voice
    "od-IN": "amit"        # Clear male Odia voice
}

class SarvamService:
    def __init__(self):
        self.api_key = settings.sarvam_api_key
        self.base_url = settings.sarvam_base_url.rstrip("/")
        
        # Supported Indic languages for bulbul:v3 TTS
        self.supported_languages = {
            "hi-IN", "en-IN", "bn-IN", "ta-IN", "te-IN",
            "kn-IN", "ml-IN", "mr-IN", "gu-IN", "pa-IN", "od-IN"
        }
        self.default_language = "en-IN"

    def _get_headers(self) -> Dict[str, str]:
        if not self.api_key:
            logger.warning("Sarvam API key is not configured.")
        return {
            "api-subscription-key": self.api_key
        }

    async def detect_language(self, text: str) -> str:
        """
        Identify the language of a text input using Sarvam AI Text LID endpoint.
        Returns a BCP-47 language code (e.g., 'hi-IN').
        """
        url = f"{self.base_url}/text-lid"
        headers = self._get_headers()
        headers["Content-Type"] = "application/json"
        
        payload = {"input": text}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                language_code = data.get("language_code", self.default_language)
                logger.info(f"Language identified: {language_code} for text snippet")
                return language_code
        except Exception as e:
            logger.error(f"Error during language detection: {e}")
            return self.default_language

    async def text_to_speech(
        self,
        text: str,
        speaker: str = "shubh",
        pace: float = 1.0,
        temperature: float = 1.0,
        speech_sample_rate: int = 24000
    ) -> Tuple[str, str]:
        """
        Converts text into base64 audio payload.
        Steps:
        1. Identify the language.
        2. Validate if supported, else fallback.
        3. Make the API call to Sarvam.
        Returns a tuple of (base64_audio_string, detected_language_code).
        """
        # Step 1 & 2: Language detection and validation
        lang = await self.detect_language(text)
        if lang not in self.supported_languages:
            logger.warning(f"Detected language '{lang}' not in supported list. Falling back to '{self.default_language}'.")
            lang = self.default_language

        # Resolve speaker: if not specified or default 'shubh', map to best fit
        resolved_speaker = speaker
        if not speaker or speaker == "shubh":
            resolved_speaker = LANGUAGE_BEST_SPEAKER_MAP.get(lang, "shubh")
            logger.info(f"Automatically selected best-fitting speaker '{resolved_speaker}' for language '{lang}'")

        url = f"{self.base_url}/text-to-speech"
        headers = self._get_headers()
        headers["Content-Type"] = "application/json"

        payload = {
            "text": text,
            "language_code": lang,
            "speaker": resolved_speaker,
            "model": "bulbul:v3",
            "pace": pace,
            "temperature": temperature,
            "speech_sample_rate": speech_sample_rate
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            audios = data.get("audios", [])
            if not audios:
                raise ValueError("No audio content returned from Sarvam TTS API.")
            
            # Return first base64 audio and language code
            return audios[0], lang

    async def speech_to_text(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        mode: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        Transcribes audio recordings into multilingual text.
        Submits a multipart/form-data request containing:
        - file: audio file binary
        - model: 'saaras:v3'
        - mode: output mode (e.g., 'transcribe')
        """
        url = f"{self.base_url}/speech-to-text"
        headers = self._get_headers()
        
        # Build multipart/form-data payload
        files = {
            "file": (filename, file_bytes, content_type)
        }
        data = {
            "model": "saaras:v3",
            "mode": mode
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, files=files, data=data, headers=headers, timeout=60.0)
            response.raise_for_status()
            return response.json()
