from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
# Importiere deine Pydantic Models und DB-Dependency
# (Passe die Imports an deine Projektstruktur an, falls nötig)
from pydantic import BaseModel
from typing import Optional

# Wir importieren den Service, den wir gerade gefixt haben
from services import apify_meta, apify_tiktok

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    platform: str
    limit: int = 20
    country: str = "US" # Default Fallback

@router.post("/")
async def search_ads(
    request: SearchRequest,
    user_id: str = Query(..., description="User ID"),
    # db: Session = Depends(get_db) # Falls du DB brauchst
):
    print(f"API Request: Searching '{request.query}' on {request.platform} in {request.country}")

    try:
        if request.platform == "meta":
            # Hier rufen wir die neue Funktion mit dem expliziten Country auf
            results = await apify_meta.search_meta_ads(
                query=request.query,
                country=request.country, 
                limit=request.limit
            )
            return {"status": "success", "data": results}
            
        elif request.platform == "tiktok":
            results = await apify_tiktok.search_tiktok_ads(
                query=request.query, 
                limit=request.limit
            )
            return {"status": "success", "data": results}

        else:
            # Beide (vereinfacht: erst Meta, dann TikTok)
            meta_results = await apify_meta.search_meta_ads(request.query, request.country, request.limit)
            tiktok_results = await apify_tiktok.search_tiktok_ads(request.query, request.limit)
            return {"status": "success", "data": meta_results + tiktok_results}

    except Exception as e:
        print(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))