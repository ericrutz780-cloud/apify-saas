from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import uuid 

# --- IMPORTS FÜR BEIDE PLATTFORMEN ---
# Hier nutzen wir jetzt die korrekte asynchrone Funktion
from app.services.apify_meta import run_apify_meta_search
# Wir gehen davon aus, dass apify_tiktok existiert (wie in deinem Code gezeigt)
try:
    from app.services import apify_tiktok
except ImportError:
    print("⚠️ Warning: apify_tiktok service not found.")
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

class SearchQuery(BaseModel):
    keyword: str
    platform: str = "meta" # meta, tiktok, both
    limit: int = 20
    country: str = "US"
    start_date_min: Optional[str] = None
    start_date_max: Optional[str] = None
    sort_by: str = "newest"
    active_status: str = "active"

@router.post("/")
async def search_ads(query: SearchQuery, background_tasks: BackgroundTasks, user_id: str = Query(..., description="User ID")):
    """
    Kombinierte Suche (Meta + TikTok).
    Fängt Fehler ab, prüft Credits, Cache und liefert Ergebnisse sofort.
    """
    print(f"API ROUTER: Live Search '{query.keyword}' | Platform: {query.platform} | Limit: {query.limit}")

    # 1. CREDITS PRÜFEN
    if not check_user_credits(user_id, query.limit):
        raise HTTPException(status_code=402, detail="Nicht genügend Credits.")

    # 2. CACHE PRÜFEN (Nur bei Einzel-Plattform Suche sinnvoll um Komplexität zu meiden)
    if query.platform in ["meta", "tiktok"]:
        cached_ads = get_cached_results(query.platform, query.keyword)
        if cached_ads and len(cached_ads) >= (query.limit * 0.5): 
            print(f"✅ Cache Hit for '{query.keyword}'")
            deduct_credits(user_id, query.limit)
            return {
                "meta": {"count": len(cached_ads), "source": "cache", "search_id": "cache-hit"},
                "data": cached_ads
            }

    # 3. LIVE SUCHE STARTEN
    results = []
    
    # --- A) META SEARCH ---
    if query.platform == "meta" or query.platform == "both":
        try:
            print(f"🚀 Starting Meta Search...")
            # WICHTIG: 'await' nutzen, da run_apify_meta_search jetzt async ist
            meta_results = await run_apify_meta_search(
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
            print(f"❌ Meta Search Error: {e}")

    # --- B) TIKTOK SEARCH ---
    if (query.platform == "tiktok" or query.platform == "both") and apify_tiktok:
        try:
            print(f"🎵 Starting TikTok Search...")
            # Wir nehmen an, dass search_tiktok_ads auch async ist
            tiktok_results = await apify_tiktok.search_tiktok_ads(
                query=query.keyword,
                limit=query.limit
            )
            if tiktok_results:
                results.extend(tiktok_results)
        except Exception as e:
            print(f"❌ TikTok Search Error: {e}")

    # Check: Haben wir überhaupt Ergebnisse?
    if not results:
        print("⚠️ No results found on any platform.")
        return {"meta": {"count": 0, "source": "live"}, "data": []}

    # 4. CREDITS ABZIEHEN & SPEICHERN
    deduct_credits(user_id, query.limit)
    
    # Wir erstellen einen Record für die Haupt-Plattform (oder 'mixed')
    record_platform = query.platform if query.platform != "both" else "mixed"
    search_id = create_search_record(record_platform, query.keyword, query.country)
    
    if search_id:
        background_tasks.add_task(save_search_details, search_id, record_platform, results)

    # 5. ERGEBNISSE SOFORT ZURÜCKGEBEN
    # Das ist entscheidend, damit der User nicht auf die DB warten muss
    print(f"✅ Returning {len(results)} live results.")
    return {
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
    Lädt historische Ergebnisse.
    Mit UUID-Schutz gegen Browser-Cache Fehler.
    """
    # --- FIX: UUID VALIDIERUNG ---
    try:
        uuid.UUID(search_id)
    except ValueError:
        print(f"⚠️ Invalid UUID ignored: {search_id}")
        return {"meta": {"count": 0, "error": "Invalid ID ignored"}, "data": []}

    client = get_supabase()
    
    try:
        response = client.table("ad_results").select("data").eq("search_ref", search_id).execute()
        
        if not response.data:
            return {"meta": {"count": 0}, "data": []}
            
        ads = [row['data'] for row in response.data]
        
        return {
            "meta": {"count": len(ads), "query": "history", "search_id": search_id},
            "data": ads
        }
    except Exception as e:
        print(f"History Fetch Error: {e}")
        return {"meta": {"count": 0, "error": str(e)}, "data": []}