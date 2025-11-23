from fastapi import APIRouter, HTTPException
from app.models.api_requests import SearchQuery

# --- KORREKTUR: Import aus den ZWEI existierenden Dateien ---
# Wir holen die Meta-Funktion aus 'apify_meta.py'
from app.services.apify_meta import fetch_meta_ads_live
# Wir holen die TikTok-Funktion aus 'apify_tiktok.py'
# (Achtung: In deiner Datei hieß die Funktion 'fetch_tiktok_viral_live')
from app.services.apify_tiktok import fetch_tiktok_viral_live

router = APIRouter()

@router.post("/")
def search_ads(query: SearchQuery):
    try:
        results = []
        
        # 1. Meta (Facebook) Suche
        if query.platform == "meta":
            results = fetch_meta_ads_live(query.keyword, query.country, query.limit)
            
        # 2. TikTok Suche
        elif query.platform == "tiktok":
            # Hier rufen wir die Funktion auf, die in 'apify_tiktok.py' definiert ist
            results = fetch_tiktok_viral_live(query.keyword, query.limit)
        
        return {
            "status": "success",
            "count": len(results),
            "data": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))