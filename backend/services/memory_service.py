import datetime
import logging
from services.mongodb_service import save_or_update_draft, get_active_draft, update_memory_status, get_all_memories_from_db
from services.cloudinary_service import upload_file_to_cloudinary
from models import AssetRecord

logger = logging.getLogger("memory_service")

def handle_asset_upload(file_bytes: bytes, filename: str, content_type: str, experience_id: str = "exp_default") -> dict:
    """
    Uploads media asset to Cloudinary and formats asset metadata according to Contract 1.
    """
    upload_res = upload_file_to_cloudinary(file_bytes, filename, content_type)
    
    contract_type = "image" if content_type.startswith("image/") else "voice_note" if content_type.startswith("audio/") else "text_note"
    cdn_url = upload_res.get("file_url") or upload_res.get("url") or ""
    
    asset = AssetRecord(
        asset_id=upload_res.get("public_id") or f"ast_{int(datetime.datetime.now().timestamp())}",
        experience_id=experience_id,
        type=contract_type,
        file_url=cdn_url,
        url=cdn_url,
        uploaded_at=datetime.datetime.utcnow().isoformat(),
        contributor_id="user",
        contributor_name="User",
        user_caption="",
        user_tags=[]
    )
    
    return asset.model_dump()

def handle_save_draft(draft_payload: dict) -> dict:
    """
    Saves or updates memory draft in MongoDB adhering to Contract 1 assets_manifest.json format.
    """
    logger.info(f"Saving memory draft: {draft_payload.get('title') or draft_payload.get('name')}")
    
    # Process items into Contract 1 asset records if needed
    raw_items = draft_payload.get("items", [])
    formatted_items = []
    
    exp_id = draft_payload.get("id") or draft_payload.get("memory_id") or "exp_draft"

    for idx, item in enumerate(raw_items):
        # Determine best CDN URL, prioritizing file_url and url over blob preview
        c_url = item.get("file_url") or item.get("url")
        if not c_url or c_url.startswith("blob:"):
            if item.get("preview") and not item.get("preview").startswith("blob:"):
                c_url = item.get("preview")
            elif not c_url:
                c_url = item.get("preview") or ""

        c_type = item.get("type")
        if c_type not in ["image", "voice_note", "text_note", "video"]:
            c_type = "image" if c_type == "photo" else "voice_note" if c_type in ["voice", "audio"] else "text_note" if c_type == "text" else "image"

        formatted_items.append({
            "asset_id": item.get("asset_id") or item.get("id") or f"ast_{int(datetime.datetime.now().timestamp())}_{idx}",
            "experience_id": exp_id,
            "type": c_type,
            "contributor_id": item.get("contributor_id") or "user",
            "contributor_name": item.get("contributor_name") or "User",
            "file_url": c_url,
            "url": c_url,
            "preview": item.get("preview") or c_url,
            "uploaded_at": item.get("uploaded_at") or datetime.datetime.utcnow().isoformat(),
            "captured_at": item.get("captured_at"),
            "geo": item.get("geo"),
            "user_caption": item.get("description") or item.get("user_caption") or "",
            "user_tags": item.get("user_tags") or []
        })
            
    draft_payload["items"] = formatted_items
    saved_doc = save_or_update_draft(draft_payload)
    return saved_doc

def handle_get_draft(memory_id: str = None) -> dict:
    """
    Fetches pending draft from MongoDB.
    """
    return get_active_draft(memory_id)

def handle_get_all_memories() -> list:
    """
    Fetches all memories from MongoDB collection.
    """
    return get_all_memories_from_db()

def handle_trigger_generation(memory_id: str) -> dict:
    """
    Transitions draft state to 'processing' and prepares AI synthesis pipeline.
    """
    success = update_memory_status(memory_id, "processing")
    return {
        "memory_id": memory_id,
        "status": "processing" if success else "failed",
        "message": "AI Memory Vault generation started!" if success else "Draft not found."
    }

def handle_get_all_memories() -> list:
    """
    Fetches all saved memories from MongoDB merged with default story presets.
    """
    db_memories = get_all_memories_from_db()
    
    presets = [
        {
            "id": "iimb-hackathon-2026",
            "memory_id": "iimb-hackathon-2026",
            "title": "IIM Bangalore",
            "subtitle": "Hackathon 2026",
            "fullTitle": "IIM Bangalore — Hackathon 2026",
            "cover": "https://res.cloudinary.com/dynoxkmjy/image/upload/v1786251613/WhatsApp_Image_2026-08-09_at_10.15.58_1_bo6co1.jpg",
            "date": "Aug 2026",
            "momentsCount": 9,
            "contributorsCount": 3,
            "timeAgo": "Recent",
            "category": "milestone",
            "status": "ready",
            "description": "30-hour hackathon trip to IIM Bangalore with Rohit, Ankush, and Udit.",
            "contributors": [
                {"id": "ankush", "name": "Ankush", "avatar": "👨🏽", "color": "#f59e0b"},
                {"id": "rohit", "name": "Rohit", "avatar": "👨🏻", "color": "#38bdf8"},
                {"id": "udit", "name": "Udit", "avatar": "👨🏽", "color": "#a78bfa"}
            ]
        },
        {
            "id": "goa-july-2026",
            "memory_id": "goa-july-2026",
            "title": "Goa Trip",
            "subtitle": "July 2026",
            "fullTitle": "Goa — July 2026",
            "cover": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80",
            "date": "Jul 2026",
            "momentsCount": 7,
            "contributorsCount": 5,
            "timeAgo": "1 month ago",
            "category": "trip",
            "status": "ready",
            "description": "5 friends • 3 days • 47 moments in Goa"
        },
        {
            "id": "college-farewell-2026",
            "memory_id": "college-farewell-2026",
            "title": "College Farewell",
            "subtitle": "May 2026",
            "fullTitle": "College Farewell — May 2026",
            "cover": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
            "date": "May 2026",
            "momentsCount": 34,
            "contributorsCount": 12,
            "timeAgo": "3 months ago",
            "category": "milestone",
            "status": "ready",
            "description": "12 friends • 1 unforgettable night • 34 moments"
        },
        {
            "id": "birthday-2026",
            "memory_id": "birthday-2026",
            "title": "Birthday 2026",
            "subtitle": "March 2026",
            "fullTitle": "Birthday — March 2026",
            "cover": "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&auto=format&fit=crop&q=80",
            "date": "Mar 2026",
            "momentsCount": 22,
            "contributorsCount": 8,
            "timeAgo": "5 months ago",
            "category": "celebration",
            "status": "ready",
            "description": "8 friends • 1 surprise • 22 moments"
        }
    ]

    db_ids = {m.get("id") or m.get("memory_id") for m in db_memories}
    combined = list(db_memories)
    for p in presets:
        if p["id"] not in db_ids and p["memory_id"] not in db_ids:
            combined.append(p)
            
    return combined

