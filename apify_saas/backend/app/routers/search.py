from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
# Korrekter Import (das war der ursprüngliche Fix für den Crash)
from app.services import apify_meta, apify_tiktok

router = APIRouter()

# --- HIER IST DER FIX FÜR DEN 422 FEHLER ---
class SearchRequest(BaseModel):
    keyword: str  # Umbenannt von 'query' zu 'keyword', damit es zum Frontend passt!
    platform: str
    limit: int = 20
    country: str = "US" # Default

@router.post("/")
async def search_ads(
    request: SearchRequest,
    user_id: str = Query(..., description="User ID")
):
    # Logge, was wirklich ankommt (zur Sicherheit)
    print(f"API ROUTER: Received search for '{request.keyword}' in country '{request.country}'")

    results = []

    try:
        # Meta Search
        if request.platform == "meta" or request.platform == "both":
            # Wir rufen den Service auf
            meta_results = await apify_meta.search_meta_ads(
                query=request.keyword, # Hier nutzen wir jetzt .keyword
                country=request.country, 
                limit=request.limit
            )
            # Tagging für Frontend
            for ad in meta_results:
                if not ad.get('platform'): ad['publisher_platform'] = ['facebook', 'instagram']
            
            results.extend(meta_results)

        # TikTok Search
        if request.platform == "tiktok" or request.platform == "both":
            tiktok_results = await apify_tiktok.search_tiktok_ads(
                query=request.keyword, # Hier nutzen wir jetzt .keyword
                limit=request.limit
            )
            results.extend(tiktok_results)
        
        return {
            "status": "success", 
            "data": results,
            "meta": {
                "count": len(results),
                "query": request.keyword,
                "country": request.country
            }
        }

    except Exception as e:
        print(f"Router Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))