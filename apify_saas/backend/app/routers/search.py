from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional, List
import uuid # Wichtig für den Absturz-Schutz
from app.services.apify_meta import run_apify_meta_search
# Wir importieren ALLES, was wir brauchen
from app.services.supabase_service import (
    get_cached_results, 
    create_search_record, 
    save_search_details,
    check_user_credits, 
    deduct_credits,
    get_supabase
)

router = APIRouter()

# Definition des Request-Models direkt hier, damit keine Import-Fehler passieren
class SearchQuery(BaseModel):
    keyword: str
    platform: str = "meta"
    limit: int = 20
    country: str = "US"
    start_date_min: Optional[str] = None
    start_date_max: Optional[str] = None
    sort_by: str = "newest"
    active_status: str = "active"

@router.post("/")
async def search_ads(query: SearchQuery, background_tasks: BackgroundTasks, user_id: str = Query(..., description="User ID")):
    """
    Haupt-Suchfunktion.
    1. Check Credits
    2. Check Cache
    3. Live Search (wenn kein Cache)
    4. Save in Background
    5. Return Results SOFORT
    """
    print(f"API ROUTER: Live Search '{query.keyword}' | Country: {query.country} | Limit: {query.limit}")

    # 1. CREDITS PRÜFEN (Wichtig für dein Business!)
    if not check_user_credits(user_id, query.limit):
        raise HTTPException(status_code=402, detail="Nicht genügend Credits. Bitte upgraden.")

    # 2. CACHE PRÜFEN (Spart Apify Kosten)
    # Wir schauen, ob wir die Suche schonmal hatten
    cached_ads = get_cached_results(query.platform, query.keyword)
    if cached_ads and len(cached_ads) >= (query.limit * 0.5): # Wenn wir zumindest 50% der gewünschten Menge haben
        print(f"✅ Cache Hit for '{query.keyword}'")
        # Optional: Reduzierte Credits für Cache? Hier ziehen wir normal ab:
        deduct_credits(user_id, query.limit)
        return {
            "meta": {"count": len(cached_ads), "source": "cache", "search_id": "cache-hit"},
            "data": cached_ads
        }

    # 3. LIVE SUCHE (Wenn Cache leer)
    # Wir nutzen den Wrapper, der die Loop-Fehler verhindert
    results = run_apify_meta_search(query.keyword, query.limit, query.country)
    
    if not results:
        # Keine Ergebnisse -> Keine Credits abziehen, leere Liste zurück
        return {"meta": {"count": 0, "source": "live"}, "data": []}

    # 4. CREDITS ABZIEHEN (Nur bei Erfolg)
    deduct_credits(user_id, query.limit)

    # 5. DATENBANK EINTRAG (Search ID erstellen)
    search_id = create_search_record(query.platform, query.keyword, query.country)
    
    # 6. HINTERGRUND SPEICHERN (Damit der User nicht warten muss)
    if search_id:
        background_tasks.add_task(save_search_details, search_id, query.platform, results)

    # 7. ERGEBNISSE SOFORT ZURÜCKGEBEN
    return {
        "meta": {
            "count": len(results), 
            "source": "live", 
            # Falls DB fehlschlägt, geben wir None zurück (Frontend nutzt dann crypto.randomUUID)
            "search_id": search_id 
        },
        "data": results 
    }

@router.get("/history/{search_id}")
def get_search_history_details(search_id: str, user_id: str):
    """
    Lädt historische Ergebnisse.
    Enthält den Fix für den UUID Absturz.
    """
    print(f"API ROUTER: Fetch History ID '{search_id}'")

    # --- FIX: UUID VALIDIERUNG ---
    # Das verhindert den 'invalid input syntax'-Fehler, wenn 'g7vyu4' kommt
    try:
        uuid.UUID(search_id)
    except ValueError:
        print(f"⚠️ Ungültige UUID erhalten: {search_id}. Ignoriere Anfrage.")
        # Wir geben einfach eine leere Liste zurück, statt abzustürzen (500)
        return {"meta": {"count": 0, "error": "Invalid ID ignored"}, "data": []}

    client = get_supabase()
    
    try:
        # Ergebnisse laden
        response = client.table("ad_results").select("data").eq("search_ref", search_id).execute()
        
        if not response.data:
            print(f"ℹ️ History leer für ID: {search_id}")
            return {"meta": {"count": 0}, "data": []}
            
        ads = [row['data'] for row in response.data]
        print(f"✅ Loaded {len(ads)} ads from history.")
        
        return {
            "meta": {"count": len(ads), "query": "history", "search_id": search_id},
            "data": ads
        }
    except Exception as e:
        # Genereller Schutz vor DB-Fehlern
        print(f"❌ History Fetch Error: {e}")
        return {"meta": {"count": 0, "error": str(e)}, "data": []}