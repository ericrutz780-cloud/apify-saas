from pydantic import BaseModel, Field
from typing import Literal, Optional

class SearchRequest(BaseModel):
    # --- PFLICHTFELDER ---
    keyword: str = Field(..., min_length=2, example="fitness")
    platform: Literal['meta', 'tiktok', 'both'] = Field(..., example="meta")
    
    # --- OPTIONALE FELDER & FILTER ---
    limit: int = Field(20, ge=1, le=100, example=20)
    
    # Frontend sendet Ländercodes wie "US", "DE"
    country: str = Field("US", min_length=2, max_length=2, pattern="^[A-Z]{2}$", example="US")
    
    # V3 Algorithmus Filter (Datums-Range & Status)
    start_date_min: Optional[str] = Field(None, example="2023-12-01")
    start_date_max: Optional[str] = Field(None, example="2023-12-31")
    active_status: Optional[str] = Field("active", example="active")
    
    # Sortierung (Wichtig für das Frontend-Mapping)
    # Erlaubt: 'newest', 'likes', 'relevancy', 'reach_views', 'spend_shares'
    sort_by: Optional[str] = Field("newest", example="newest")