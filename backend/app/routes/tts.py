import base64
import logging
from typing import Literal
from fastapi import APIRouter, HTTPException, status, Response
from pydantic import BaseModel, Field, field_validator
from app.services.sarvam_service import SarvamService

logger = logging.getLogger(__name__)
router = APIRouter()
sarvam_service = SarvamService()

class TTSRequest(BaseModel):
    text: str = Field(..., description="The text content to convert to speech.")
    speaker: str = Field(default="shubh", description="Voice speaker name (e.g. shubh, ritu).")
    pace: float = Field(default=1.0, description="Speed of speech.")
    temperature: float = Field(default=1.0, description="Temperature parameter for bulbul:v3 voice expressiveness.")
    mood: str = Field(default="", description="Optional emotional mood (excited, warm, nostalgic, funny, somber, neutral).")
    speech_sample_rate: int = Field(default=24000, description="Speech sample rate in Hz.")
    output_format: Literal["binary", "base64"] = Field(
        default="binary",
        description="Format of the response: 'binary' returns raw audio file bytes, 'base64' returns JSON."
    )

    @field_validator("text")
    @classmethod
    def validate_text_length(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Text cannot be empty or whitespace-only.")
        if len(v) > 2500:
            raise ValueError("Text exceeds maximum limit of 2500 characters.")
        return v

    @field_validator("pace")
    @classmethod
    def validate_pace_range(cls, v: float) -> float:
        if not (0.5 <= v <= 2.0):
            raise ValueError("Pace must be between 0.5 and 2.0.")
        return v

    @field_validator("temperature")
    @classmethod
    def validate_temp_range(cls, v: float) -> float:
        if not (0.01 <= v <= 2.0):
            raise ValueError("Temperature must be between 0.01 and 2.0.")
        return v

    @field_validator("speech_sample_rate")
    @classmethod
    def validate_sample_rate(cls, v: int) -> int:
        allowed_rates = {8000, 16000, 22050, 24000, 32000, 44100, 48000}
        if v not in allowed_rates:
            raise ValueError(f"Speech sample rate must be one of {allowed_rates}")
        return v


MOOD_TTS_MAP = {
    "excited":   {"pace": 1.0, "temperature": 0.8},
    "warm":      {"pace": 1.0, "temperature": 0.55},
    "nostalgic": {"pace": 1.0, "temperature": 0.5},
    "funny":     {"pace": 1.0, "temperature": 0.9},
    "somber":    {"pace": 1.0, "temperature": 0.4},
    "neutral":   {"pace": 1.0, "temperature": 0.6}
}


@router.post("/api/text-to-speech")
async def text_to_speech(request: TTSRequest):
    """
    Text-to-Speech Endpoint.
    Accepts text and configuration options, calls Sarvam AI TTS API,
    and returns either binary audio or a base64 encoded payload.
    """
    # 1. Resolve pace and temperature from mood mapping if mood is provided
    pace = request.pace
    temp = request.temperature
    
    if request.mood:
        mood_lower = request.mood.lower().strip()
        if mood_lower in MOOD_TTS_MAP:
            mapped_params = MOOD_TTS_MAP[mood_lower]
            # Use mapped parameters if they were not explicitly overridden
            # We check what fields were passed to the constructor using model_fields_set
            if "pace" not in request.model_fields_set:
                pace = mapped_params["pace"]
            if "temperature" not in request.model_fields_set:
                temp = mapped_params["temperature"]
            logger.info(f"Resolved mood '{request.mood}' to pace={pace}, temperature={temp}")
        else:
            logger.warning(f"Unrecognized mood '{request.mood}' provided. Using direct parameters.")

    logger.info(f"Received text-to-speech request. Length: {len(request.text)}, speaker: {request.speaker}, pace: {pace}, temperature: {temp}, format: {request.output_format}")
    
    try:
        # Call service layer
        base64_audio, detected_lang = await sarvam_service.text_to_speech(
            text=request.text,
            speaker=request.speaker,
            pace=pace,
            temperature=temp,
            speech_sample_rate=request.speech_sample_rate
        )

        if request.output_format == "binary":
            try:
                audio_bytes = base64.b64decode(base64_audio)
            except Exception as e:
                logger.error(f"Failed to decode base64 audio payload: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Invalid base64 payload returned from upstream service."
                )
            
            headers = {
                "Content-Disposition": 'attachment; filename="speech.wav"',
                "X-Detected-Language": detected_lang
            }
            return Response(content=audio_bytes, media_type="audio/wav", headers=headers)
        
        else: # "base64"
            return {
                "audio_base64": base64_audio,
                "detected_language": detected_lang,
                "format": "audio/wav"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during text-to-speech processing: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text-to-Speech conversion failed: {str(e)}"
        )
