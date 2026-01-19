from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import uuid 
import logging

# Services
from app.services import apify_meta

# Optionaler Import für TikTok (verhindert Absturz, falls Modul fehlt)
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
    Führt eine Live-Suche durch oder holt Ergebnisse aus dem Cache.
    """
    # 1. Credits prüfen
    if not check_user_credits(user_id, query.limit):
        raise HTTPException(status_code=402, detail="Nicht genügend Credits vorhanden.")

    # 2. Cache prüfen (nur wenn eindeutige Plattform gewählt, bei 'both' überspringen wir Cache der Einfachheit halber)
    if query.platform in ["meta", "tiktok"]:
        cached_ads = get_cached_results(query.platform, query.keyword)
        # Wir nutzen den Cache nur, wenn genug Daten da sind (mind. 50% des Limits)
        if cached_ads and len(cached_ads) >= (query.limit * 0.5): 
            # Auch bei Cache-Hit Credits abziehen (oder reduzierte Rate, je nach Business Logik)
            deduct_credits(user_id, query.limit)
            return {
                "id": "cache-hit",
                "params": {"query": query.keyword, "country": query.country, "platform": query.platform},
                "meta": {
                    "count": len(cached_ads), 
                    "source": "cache", 
                    "search_id": "cache-hit"
                },
                "data": cached_ads
            }

    # 3. Live Suche starten
    results = []
    
    # -- META (Facebook/Instagram) --
    if query.platform == "meta" or query.platform == "both":
        try:
            # Aufruf ist jetzt korrekt asynchron
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
        
        # Such-Datensatz in DB anlegen
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
    # FIX: UUID Schutz - verhindert DB-Fehler bei ungültigen Strings
    try:
        uuid.UUID(search_id)
    except ValueError:
        return {
            "meta": {"count": 0, "error": "Invalid UUID format"}, 
            "data": []
        }

    client = get_supabase()
    
    # Metadaten der Suche holen (Query, Land, etc.)
    search_meta = {}
    try:
        meta_res = client.table("search_cache").select("*").eq("id", search_id).maybe_single().execute()
        if meta_res.data: 
            search_meta = meta_res.data
    except Exception as e:
        logger.warning(f"History Meta Error: {e}")

    # Die eigentlichen Ads holen
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
                # FIX: Hier stand vorher 'history', was den Suchbegriff überschrieben hat!
                "query": search_meta.get("query", ""), 
                "search_id": search_id
            },
            "data": ads
        }
    except Exception as e:
        logger.error(f"History Fetch Error: {e}")
        return {"meta": {"count": 0, "error": str(e)}, "data": []}