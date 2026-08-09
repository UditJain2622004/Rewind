from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class GeoLocation(BaseModel):
    lat: float
    lng: float

class AssetRecord(BaseModel):
    # Required fields
    asset_id: str = Field(..., description="Unique ID of asset, e.g., ast_0001")
    experience_id: str = Field(..., description="Parent experience ID, e.g., exp_iimb_hackathon")
    type: str = Field(..., description="Asset type: image, video, voice_note, text_note")
    file_url: str = Field(..., description="Cloudinary or public file URL")
    url: Optional[str] = Field(default=None, description="Alias for file_url")
    uploaded_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="Upload timestamp")

    # Optional fields
    contributor_id: Optional[str] = Field(default="user", description="Contributor user ID")
    contributor_name: Optional[str] = Field(default="User", description="Contributor display name")
    captured_at: Optional[str] = Field(default=None, description="EXIF timestamp if available")
    geo: Optional[GeoLocation] = Field(default=None, description="Geo location coordinates")
    user_caption: Optional[str] = Field(default="", description="User provided description or caption")
    user_tags: Optional[List[str]] = Field(default_factory=list, description="User provided tags")

    # Voice / Text note specific optional fields
    recorded_at: Optional[str] = Field(default=None, description="Audio recording timestamp")
    duration_sec: Optional[float] = Field(default=None, description="Audio duration in seconds")
    linked_asset_ids: Optional[List[str]] = Field(default_factory=list, description="Associated photo IDs")
    raw_text: Optional[str] = Field(default=None, description="STT transcript (populated by Memory Understanding)")

class ExperienceManifest(BaseModel):
    experience_id: str
    title: str
    status: Optional[str] = "draft"
    voice_style: Optional[str] = "Warm & Nostalgic"
    assets: List[AssetRecord] = Field(default_factory=list)
    created_at: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())
