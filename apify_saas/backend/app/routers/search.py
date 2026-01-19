from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import uuid 
import logging

# Services
from app.services import apify_meta

# Optionaler Import für TikTok
try:
    from app.services import apify_tiktok
except ImportError:
    apify_tiktok = None

from app.services.supabase_service import (
    get_cached_results, 
    create_search_record, 
    save_search_details,
    check_user_credits, 
    deduct_credits,
    get_supabase
)

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Pydantic Models ---

class SearchQuery(BaseModel):
    keyword: str
    platform: str = "meta"
    limit: int = 20
    country: str = "US"
    start_date_min: Optional[str] = None
    start_date_max: Optional[str] = None
    sort_by: str = "newest"
    active_status: str = "active"

# --- Endpoints ---

@router.post("/")
async def search_ads(query: SearchQuery, background_tasks: BackgroundTasks, user_id: str = Query(..., description="User ID")):
    """
    Führt IMMER eine Live-Suche durch (Cache wurde auf User-Wunsch deaktiviert).
    """
    # 1. Credits prüfen
    if not check_user_credits(user_id, query.limit):
        raise HTTPException(status_code=402, detail="Nicht genügend Credits vorhanden.")

    # 2. [ENTFERNT] Cache Logik
    # Auf expliziten Wunsch wurde der Cache-Check hier entfernt. 
    # Jede Suche triggert nun den Actor.

    # 3. Live Suche starten
    results = []
    
    # -- META (Facebook/Instagram) --
    if query.platform == "meta" or query.platform == "both":
        try:
            # Asynchroner Aufruf des Scrapers
            meta_results = await apify_meta.search_meta_ads(
                query=query.keyword, 
                limit=query.limit, 
                country=query.country,
                start_date_min=query.start_date_min, 
                start_date_max=query.start_date_max,
                active_status=query.active_status
            )
            if meta_results: 
                results.extend(meta_results)
        except Exception as e:
            logger.error(f"Meta Search Error: {e}")

    # -- TIKTOK --
    if (query.platform == "tiktok" or query.platform == "both") and apify_tiktok:
        try:
            tiktok_results = await apify_tiktok.search_tiktok_ads(query.keyword, query.limit)
            if tiktok_results: 
                results.extend(tiktok_results)
        except Exception as e:
            logger.error(f"TikTok Search Error: {e}")

    # 4. Ergebnis verarbeiten & Speichern
    search_id = None
    if results:
        # Credits abziehen, da Ergebnisse geliefert wurden
        deduct_credits(user_id, query.limit)
        
        # Such-Datensatz in DB anlegen (für Historie/Dashboard)
        search_id = create_search_record(query.platform, query.keyword, query.country)
        
        # Ergebnisse im Hintergrund speichern (non-blocking)
        if search_id:
            background_tasks.add_task(save_search_details, search_id, query.platform, results)

    # 5. Response zurückgeben
    return {
        "id": search_id,
        "params": {
            "query": query.keyword,
            "country": query.country,
            "platform": query.platform,
            "limit": query.limit
        },
        "meta": {
            "count": len(results), 
            "source": "live", 
            "search_id": search_id 
        },
        "data": results 
    }

@router.get("/history/{search_id}")
def get_search_history_details(search_id: str, user_id: str):
    """
    Lädt historische Suchergebnisse anhand der Search-ID.
    """
    # FIX: UUID Schutz - verhindert DB-Fehler bei ungültigen Strings wie "cache-hit"
    try:
        uuid.UUID(search_id)
    except ValueError:
        return {
            "meta": {"count": 0, "error": "Invalid UUID format"}, 
            "data": []
        }

    client = get_supabase()
    
    # Metadaten der Suche holen
    search_meta = {}
    try:
        meta_res = client.table("search_cache").select("*").eq("id", search_id).maybe_single().execute()
        if meta_res.data: 
            search_meta = meta_res.data
    except Exception as e:
        logger.warning(f"History Meta Error: {e}")

    # Ads holen
    try:
        response = client.table("ad_results").select("data").eq("search_ref", search_id).execute()
        ads = [row['data'] for row in response.data] if response.data else []
        
        return {
            "id": search_id,
            "params": {
                "query": search_meta.get("query", ""),
                "country": search_meta.get("country", "DE"),
                "platform": search_meta.get("platform", "meta")
            },
            "meta": {
                "count": len(ads), 
                "query": search_meta.get("query", ""), 
                "search_id": search_id
            },
            "data": ads
        }
    except Exception as e:
        logger.error(f"History Fetch Error: {e}")
        return {"meta": {"count": 0, "error": str(e)}, "data": []}