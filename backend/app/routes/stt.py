import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.services.sarvam_service import SarvamService

logger = logging.getLogger(__name__)
router = APIRouter()
sarvam_service = SarvamService()

@router.post("/api/speech-to-text", status_code=status.HTTP_200_OK)
async def speech_to_text(
    file: UploadFile = File(...),
    mode: str = Form("transcribe")
):
    """
    Speech-to-Text Endpoint.
    Accepts an audio file and an optional mode parameter (e.g., 'transcribe').
    Sends the audio file to Sarvam AI for transcription.
    """
    logger.info(f"Received speech-to-text request for file: {file.filename}, content_type: {file.content_type}, mode: {mode}")
    
    # 1. Validate file format / content type
    allowed_extensions = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".opus", ".aac", ".mp4", ".amr", ".wma", ".webm"}
    filename_lower = file.filename.lower()
    if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
        logger.warning(f"Unsupported file format: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported formats are: {', '.join(allowed_extensions)}"
        )

    try:
        # 2. Read the file bytes and content type
        file_bytes = await file.read()
        content_type = file.content_type or "audio/octet-stream"

        # 3. Call sarvam_service.speech_to_text(...)
        result = await sarvam_service.speech_to_text(
            file_bytes=file_bytes,
            filename=file.filename,
            content_type=content_type,
            mode=mode
        )
        return result
    except Exception as e:
        logger.error(f"Error during speech-to-text transcription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech-to-Text transcription failed: {str(e)}"
        )
