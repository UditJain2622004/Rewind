import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

# Import memory services from main origin
from services.memory_service import (
    handle_asset_upload,
    handle_save_draft,
    handle_get_draft,
    handle_trigger_generation
)

# Import stt, tts, relive routers from feature branch
from app.routes import stt, tts, relive

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rewind_backend")

app = FastAPI(
    title="Rewind — AI Memory Engine API",
    description="Backend API powered by FastAPI, MongoDB, Cloudinary, and Sarvam AI.",
    version="1.0.0"
)

# Enable CORS for Frontend Vite Dev Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints from feature branch
app.include_router(stt.router)
app.include_router(tts.router)
app.include_router(relive.router)

# Mount static folder
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

class DraftPayload(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    voice_style: Optional[str] = "Warm & Nostalgic"
    status: Optional[str] = "draft"
    items: Optional[List[dict]] = []

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Rewind AI Memory Engine",
        "database": "MongoDB Atlas",
        "media_storage": "Cloudinary"
    }

@app.post("/api/upload")
async def upload_asset(file: UploadFile = File(...)):
    """
    Uploads photo or audio file to Cloudinary and returns CDN URL.
    """
    try:
        contents = await file.read()
        asset_info = handle_asset_upload(contents, file.filename, file.content_type)
        return asset_info
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/memories/draft")
def save_draft(payload: DraftPayload):
    """
    Saves or updates active memory draft in MongoDB.
    """
    try:
        result = handle_save_draft(payload.model_dump())
        return {"status": "success", "draft": result}
    except Exception as e:
        logger.error(f"Draft save error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memories/draft")
def get_draft(memory_id: Optional[str] = None):
    """
    Retrieves active draft memory from MongoDB.
    """
    draft = handle_get_draft(memory_id)
    if not draft:
        return {"status": "none", "draft": None}
    return {"status": "success", "draft": draft}

@app.post("/api/memories/{memory_id}/generate")
def generate_memory(memory_id: str):
    """
    Transitions memory status from 'draft' to 'processing' and triggers synthesis.
    """
    result = handle_trigger_generation(memory_id)
    return result

if __name__ == "__main__":
    import uvicorn
    # Use config-based host and port if available, else default to 0.0.0.0:8000
    try:
        from app.config import settings
        host = settings.host
        port = settings.port
        debug = settings.debug
    except Exception:
        host = "0.0.0.0"
        port = 8000
        debug = True
        
    uvicorn.run("app.py:app", host=host, port=port, reload=debug)
