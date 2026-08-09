import logging
from fastapi import APIRouter, HTTPException, status
from app.services.video_service import VideoService

logger = logging.getLogger(__name__)
router = APIRouter()
video_service = VideoService()

@router.post("/api/assemble-relive", status_code=status.HTTP_200_OK)
async def assemble_relive():
    """
    Trigger compilation of the Relive experience.
    Generates static WAV audio files for all segments in script.json,
    computes their timings, and outputs tts_output.json.
    """
    logger.info("Received request to assemble relive media")
    try:
        result = await video_service.assemble_relive()
        # Save or update assembled video story in MongoDB memory vault
        try:
            from services.memory_service import handle_save_draft
            handle_save_draft({
                "id": "iimb-hackathon-2026",
                "title": "IIM Bangalore — Hackathon 2026",
                "name": "IIM Bangalore",
                "status": "ready",
                "items": result.get("audio_segments", [])
            })
        except Exception as err:
            logger.warning(f"Could not sync assembled story to MongoDB: {err}")
        return result
    except FileNotFoundError as e:
        logger.error(f"Script files missing: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to assemble relive media: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assembly failed: {str(e)}"
        )

@router.get("/api/relive-data", status_code=status.HTTP_200_OK)
async def get_relive_data():
    """
    Returns unified timeline data (script.json, assets_manifest.json, tts_output.json)
    for easy client-side integration and playback mapping.
    """
    logger.info("Received request for relive visual & timing data")
    try:
        data = video_service.get_relive_data()
        return data
    except FileNotFoundError as e:
        logger.error(f"Source script files missing: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source files (script.json / assets_manifest.json) are missing. Please verify backend setup."
        )
    except Exception as e:
        logger.error(f"Failed to get relive data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch relive data: {str(e)}"
        )

@router.get("/api/explore", status_code=status.HTTP_200_OK)
async def explore(query: str):
    """
    Explore / Q&A Endpoint.
    Answers natural language questions about the IIM B hackathon experience
    using the facts stored in memory.md.
    """
    logger.info(f"Received Q&A query: {query}")
    if not query or not query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query parameter is required."
        )
        
    q = query.lower().strip()
    
    # Keyword-based matching for high-quality mock responses
    if any(k in q for k in ["who", "people", "person", "contributor"]):
        answer = "The memory features Rohit, Ankush, and Udit. Rohit and Ankush travelled overnight by a general coach train and Rohit eventually dozed off on day two. Udit is based in Bangalore and arrived fresh."
    elif any(k in q for k in ["prank", "logo", "sign", "admission"]):
        answer = "They stood under the IIM B sign and sent a photo to the class group chat to prank everyone into thinking they had gotten admission."
    elif any(k in q for k in ["water tank", "tank", "3 idiots", "idiots"]):
        answer = "They visited the famous water tank from 3 Idiots early in the morning and returned near there for photos on the butt chairs at night."
    elif any(k in q for k in ["butt chair", "chair"]):
        answer = "They snuck in a few night shots on the famous butt chairs after midnight, before they had to leave campus to hunt for a hotel."
    elif any(k in q for k in ["sleep", "nap", "doze", "tired", "exhausted", "rohit"]):
        answer = "Rohit was found completely dozed off in his chair, laptop still open, by the afternoon of day two due to sleep deprivation from their overnight train ride."
    elif any(k in q for k in ["win", "winner", "trophy", "lose", "lost"]):
        answer = "They didn't win the hackathon. But before leaving, they took one last round of photos at the water tank and said goodbye to IIM B."
    elif any(k in q for k in ["hotel", "overnight", "stay", "night"]):
        answer = "They stayed overnight at a hotel since staying on campus overnight wasn't allowed. The specific hotel is not mentioned in the notes."
    elif any(k in q for k in ["train", "arrive", "arrival", "travel"]):
        answer = "Rohit and Ankush travelled overnight packed in a general coach train and arrived exhausted. Udit lives in Bangalore and arrived fresh."
    else:
        # Fallback summary
        answer = "This was a 30-hour hackathon trip to IIM Bangalore for Rohit, Ankush, and Udit. Key highlights include an overnight train ride, a campus prank, campus exploration (the 3 Idiots water tank and butt chairs), building, Rohit's legendary nap, and a goodbye photo."
        
    return {
        "query": query,
        "answer": answer
    }
