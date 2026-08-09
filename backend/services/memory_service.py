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
