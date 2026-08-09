"""Full AI-Memory generation pipeline endpoint.

POST /api/memories/{memory_id}/full-generate
  - Fetches the saved draft (items) from MongoDB.
  - Writes assets_manifest.json for the pipeline.
  - Runs asset_insights → memory_generation → script_generation.
  - Streams Server-Sent Events so the frontend can show progress.

GET /api/memories
  - Returns all memories stored in MongoDB (for the Dashboard).

GET /api/memories/{memory_id}
  - Returns a single memory by ID.
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
import os
from pathlib import Path
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

# Ensure the backend root is on sys.path so pipeline_service can import
# asset_insights, memory_generation, script_generation directly.
_backend_dir = str(Path(__file__).resolve().parents[2])
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_db():
    """Return the MongoDB database handle (or None)."""
    try:
        import config as cfg
        from pymongo import MongoClient
        client = MongoClient(cfg.MONGODB_URI, serverSelectionTimeoutMS=3000, tlsAllowInvalidCertificates=True)
        client.admin.command("ping")
        return client[cfg.DB_NAME]
    except Exception as exc:
        logger.warning("MongoDB unavailable: %s", exc)
        return None


def _draft_to_manifest(draft: dict) -> list[dict]:
    """Convert MongoDB draft items to a valid assets_manifest array."""
    import datetime
    items = draft.get("items") or []
    manifest = []
    for item in items:
        a_type = item.get("type", "image")
        if a_type not in ("image", "voice_note", "text_note"):
            a_type = "image"
        record: dict = {
            "asset_id": item.get("asset_id") or item.get("id") or f"ast_{len(manifest):04d}",
            "experience_id": draft.get("memory_id") or draft.get("_id") or "exp_unknown",
            "type": a_type,
            "contributor_id": item.get("contributor_id") or "user",
            "contributor_name": item.get("contributor_name") or "User",
            "file_url": item.get("file_url") or item.get("url") or "",
            "uploaded_at": item.get("uploaded_at") or datetime.datetime.utcnow().isoformat() + "Z",
            "user_caption": item.get("user_caption") or item.get("description") or "",
            "user_tags": item.get("user_tags") or [],
        }
        if item.get("captured_at"):
            record["captured_at"] = item["captured_at"]
        if a_type == "voice_note" and item.get("raw_text"):
            record["raw_text"] = item["raw_text"]
        manifest.append(record)
    return manifest


# ---------------------------------------------------------------------------
# SSE generator
# ---------------------------------------------------------------------------

async def _pipeline_sse(memory_id: str, manifest_data: list[dict]) -> AsyncGenerator[str, None]:
    """Run pipeline in a thread pool and yield SSE progress lines."""

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue[dict] = asyncio.Queue()

    def progress_cb(msg: str, pct: float) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, {"step": msg, "progress": round(pct * 100)})

    async def run_in_thread():
        try:
            from pipeline_service import run_pipeline
            result = await loop.run_in_executor(
                None,
                lambda: run_pipeline(memory_id, manifest_data, progress_cb=progress_cb),
            )
            queue.put_nowait({"done": True, "result": result})
        except Exception as exc:
            logger.exception("Pipeline failed for %s", memory_id)
            queue.put_nowait({"error": str(exc)})

    asyncio.ensure_future(run_in_thread())

    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=300)
        except asyncio.TimeoutError:
            yield "data: {\"error\": \"Pipeline timed out\"}\n\n"
            break

        yield f"data: {json.dumps(event)}\n\n"

        if event.get("done") or event.get("error"):
            break


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/api/memories/{memory_id}/full-generate")
async def full_generate(memory_id: str):
    """
    Trigger the full AI pipeline for a saved memory draft.
    Returns an SSE stream of progress events.
    """
    db = _get_db()
    draft = None

    if db is not None:
        try:
            col = db["memories"]
            draft = col.find_one({"_id": memory_id}) or col.find_one({"memory_id": memory_id})
        except Exception as exc:
            logger.warning("MongoDB read error: %s", exc)

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory draft '{memory_id}' not found. Save it first via /api/memories/draft.",
        )

    manifest_data = _draft_to_manifest(draft)
    if not manifest_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The memory draft has no assets. Upload some photos or voice notes first.",
        )

    return StreamingResponse(
        _pipeline_sse(memory_id, manifest_data),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/api/memory-list")
def list_memories():
    """Return all memories stored in MongoDB (for the Dashboard)."""
    db = _get_db()
    if db is None:
        return {"memories": []}
    try:
        col = db["memories"]
        docs = list(col.find({}, {"_id": 0}).sort("updated_at", -1).limit(50))
        return {"memories": docs}
    except Exception as exc:
        logger.error("Error listing memories: %s", exc)
        return {"memories": []}


@router.get("/api/memory/{memory_id}")
def get_memory(memory_id: str):
    """Return a single memory by ID."""
    db = _get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        col = db["memories"]
        doc = col.find_one({"$or": [{"_id": memory_id}, {"memory_id": memory_id}]}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Memory not found")
        return doc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/memory/{memory_id}/artifacts")
def get_memory_artifacts(memory_id: str):
    """Return memory.json content for a generated memory (for Explore Q&A, Relive)."""
    from pipeline_service import _base_static
    exp_dir = _base_static() / "experiences" / memory_id
    memory_json_path = exp_dir / "memory.json"
    memory_md_path = exp_dir / "memory.md"

    if not memory_json_path.exists():
        raise HTTPException(
            status_code=404,
            detail="AI artifacts not yet generated. Run full-generate first.",
        )

    memory_json = json.loads(memory_json_path.read_text(encoding="utf-8"))
    memory_md = memory_md_path.read_text(encoding="utf-8") if memory_md_path.exists() else ""
    return {"memory_json": memory_json, "memory_md": memory_md}
