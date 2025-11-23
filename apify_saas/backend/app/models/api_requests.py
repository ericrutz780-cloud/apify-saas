from pydantic import BaseModel, Field
from typing import Literal, Optional

class SearchQuery(BaseModel):
    # --- PFLICHTFELDER ---
    
    # Das Keyword (min. 2 Zeichen, damit keine leeren Suchen passieren)
    keyword: str = Field(..., min_length=2, example="fitness")
    
    # Welcher Scraper soll genutzt werden?
    platform: Literal['meta', 'tiktok'] = Field(..., example="tiktok")
    
    # --- OPTIONALE FELDER MIT DEFAULTS ---
    
    # Das Limit (Schutz vor Kostenexplosion: Max 100)
    limit: int = Field(10, ge=1, le=100, example=10)
    
    # Das Land (Backend erwartet STRIKT 2 Buchstaben, z.B. "US")
    # Das Frontend muss "United States" in "US" umwandeln, bevor es das sendet!
    country: str = Field("US", min_length=2, max_length=2, pattern="^[A-Z]{2}$", example="US")
    
    # Zeitraum in Tagen (Wichtig für TikTok "Viralität")
    # Default: 30 Tage (Standard für Dropshipping Trends)
    period: int = Field(30, ge=1, le=365, example=30)
    
    # Sortierung (Wir erlauben nur sichere Werte)
    # 'relevancy' = Standard Meta
    # 'likes' = Viralität TikTok
    # 'newest' = Frische Ads
    sort_by: Literal['relevancy', 'likes', 'newest'] = Field("relevancy", example="likes")