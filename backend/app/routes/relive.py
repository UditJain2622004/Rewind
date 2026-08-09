"""Relive + Explore routes.

Endpoints:
  POST /api/assemble-relive?memory_id=...   — TTS-assemble script for a memory
  GET  /api/relive-data?memory_id=...        — Unified timeline data for frontend player
  GET  /api/explore?query=...&memory_id=... — Grounded Q&A via Sarvam-105B
"""

import json
import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from app.services.video_service import VideoService

logger = logging.getLogger(__name__)
router = APIRouter()
video_service = VideoService()


# ---------------------------------------------------------------------------
# Experience-dir helper
# ---------------------------------------------------------------------------

def _experience_dir(memory_id: str) -> Path:
    base = Path(__file__).resolve().parents[3] / "static" / "experiences"
    return base / memory_id


# ---------------------------------------------------------------------------
# Relive assembly + data
# ---------------------------------------------------------------------------

@router.post("/api/assemble-relive", status_code=status.HTTP_200_OK)
async def assemble_relive(memory_id: str = ""):
    """
    Trigger TTS compilation for a memory's relive script.
    Generates WAV audio files for all script segments and outputs tts_output.json.
    """
    logger.info("Received request to assemble relive media for memory_id=%s", memory_id)
    try:
        result = await video_service.assemble_relive(memory_id=memory_id)
        if memory_id:
            try:
                from services.memory_service import handle_save_draft
                handle_save_draft({
                    "id": memory_id,
                    "status": "ready",
                    "items": result.get("audio_segments", [])
                })
            except Exception as err:
                logger.warning(f"Could not sync assembled story to MongoDB: {err}")
        return result
    except FileNotFoundError as exc:
        logger.error("Script files missing: %s", exc)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Failed to assemble relive media: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Assembly failed: {exc}")


@router.get("/api/relive-data", status_code=status.HTTP_200_OK)
async def get_relive_data(memory_id: str = ""):
    """
    Returns unified timeline data (script, assets_manifest, tts_output)
    for the given memory_id, ready for the Relive player.
    """
    logger.info("Received request for relive data, memory_id=%s", memory_id)
    try:
        data = video_service.get_relive_data(memory_id=memory_id)
        return data
    except FileNotFoundError as exc:
        logger.error("Source script files missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Script not found. Generate the AI story first.",
        )
    except Exception as exc:
        logger.error("Failed to get relive data: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


# ---------------------------------------------------------------------------
# Explore / Q&A
# ---------------------------------------------------------------------------

def _sarvam_qa(question: str, memory_json: dict, memory_md: str) -> str:
    """Ask Sarvam-105B a question grounded in the generated memory artifacts."""
    key = os.environ.get("SARVAM_API_KEY", "")
    if not key:
        return _keyword_fallback(question)
    try:
        from sarvamai import SarvamAI
        client = SarvamAI(api_subscription_key=key)
        context = (
            f"Memory JSON:\n{json.dumps(memory_json, ensure_ascii=False, indent=2)[:4000]}\n\n"
            f"Memory Narrative:\n{memory_md[:3000]}"
        )
        response = client.chat.completions(
            model="sarvam-105b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI assistant that answers questions about a personal memory experience. "
                        "Use only facts present in the supplied memory JSON and narrative. "
                        "Be warm, specific, and concise (2-4 sentences). "
                        "If the answer is not in the evidence, say so honestly rather than inventing."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Memory evidence:\n{context}\n\nQuestion: {question}",
                },
            ],
            temperature=0.2,
            max_tokens=400,
        )
        choices = getattr(response, "choices", None) or []
        if choices:
            msg = getattr(choices[0], "message", None)
            content = getattr(msg, "content", None) if msg else None
            if content:
                return content.strip()
    except Exception as exc:
        logger.warning("Sarvam Q&A failed: %s", exc)
    return _keyword_fallback(question)


def _keyword_fallback(question: str) -> str:
    """Keyword-based stub for the IIM-B demo when no real artifacts exist."""
    q = question.lower().strip()
    if any(k in q for k in ["who", "people", "person", "contributor"]):
        return "The memory features Rohit, Ankush, and Udit. Rohit and Ankush travelled overnight by a general coach train and Rohit eventually dozed off on day two. Udit is based in Bangalore and arrived fresh."
    if any(k in q for k in ["prank", "logo", "sign", "admission"]):
        return "They stood under the IIM B sign and sent a photo to the class group chat to prank everyone into thinking they had gotten admission."
    if any(k in q for k in ["water tank", "tank", "3 idiots", "idiots"]):
        return "They visited the famous water tank from 3 Idiots early in the morning and returned near there for photos on the butt chairs at night."
    if any(k in q for k in ["butt chair", "chair"]):
        return "They snuck in a few night shots on the famous butt chairs after midnight, before they had to leave campus to hunt for a hotel."
    if any(k in q for k in ["sleep", "nap", "doze", "tired", "exhausted", "rohit"]):
        return "Rohit was found completely dozed off in his chair, laptop still open, by the afternoon of day two due to sleep deprivation from their overnight train ride."
    if any(k in q for k in ["win", "winner", "trophy", "lose", "lost"]):
        return "They didn't win the hackathon. But before leaving, they took one last round of photos at the water tank and said goodbye to IIM B."
    if any(k in q for k in ["hotel", "overnight", "stay", "night"]):
        return "They stayed overnight at a hotel since staying on campus overnight wasn't allowed."
    if any(k in q for k in ["train", "arrive", "arrival", "travel"]):
        return "Rohit and Ankush travelled overnight packed in a general coach train and arrived exhausted. Udit lives in Bangalore and arrived fresh."
    return (
        "This was a 30-hour hackathon trip to IIM Bangalore for Rohit, Ankush, and Udit. "
        "Key highlights include an overnight train ride, a campus prank, the 3 Idiots water tank, "
        "butt chairs, building their project, Rohit's legendary nap, and a goodbye photo."
    )


@router.get("/api/explore", status_code=status.HTTP_200_OK)
async def explore(query: str, memory_id: str = ""):
    """
    Answer a natural language question about a memory.
    Grounds the answer in real AI artifacts (memory.json + memory.md) when available.
    Falls back to a keyword-matching stub otherwise.
    """
    if not query or not query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query parameter is required.")

    if memory_id:
        exp_dir = _experience_dir(memory_id)
        memory_json_path = exp_dir / "memory.json"
        memory_md_path = exp_dir / "memory.md"
        if memory_json_path.exists():
            try:
                memory_json = json.loads(memory_json_path.read_text(encoding="utf-8"))
                memory_md = memory_md_path.read_text(encoding="utf-8") if memory_md_path.exists() else ""
                answer = _sarvam_qa(query.strip(), memory_json, memory_md)
                return {"query": query, "answer": answer, "grounded": True}
            except Exception as exc:
                logger.warning("Could not use real artifacts for %s: %s", memory_id, exc)

    answer = _keyword_fallback(query.strip())
    return {"query": query, "answer": answer, "grounded": False}
