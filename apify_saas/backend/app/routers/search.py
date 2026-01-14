from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.models.api_requests import SearchRequest
from app.services import apify_meta, apify_tiktok
# WICHTIG: Wir importieren 'supabase' hier direkt, um Daten abzurufen
from app.services.supabase_service import save_search_results, supabase

router = APIRouter()

# --- NEU: RERUN FUNKTION ---
# Dieser Endpunkt holt alte Ergebnisse aus der Datenbank
@router.get("/history/{search_id}")
async def get_search_history(
    search_id: str,
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Rerun Search ID '{search_id}' for User: {user_id}")
    
    try:
        # Wir suchen in der Tabelle 'search_results' nach dem Eintrag mit der ID
        # HINWEIS: Stelle sicher, dass deine Tabelle in Supabase 'search_results' heißt 
        # und eine Spalte 'id' sowie 'ads_data' (JSON) hat.
        response = supabase.table("search_results").select("*").eq("id", search_id).execute()
        
        # Prüfen ob Daten gefunden wurden
        if not response.data or len(response.data) == 0:
            print(f"❌ Search ID {search_id} not found in DB.")
            raise HTTPException(status_code=404, detail="Search result not found in history")
            
        saved_entry = response.data[0]
        results = saved_entry.get("ads_data", [])
        
        print(f"✅ Loaded {len(results)} ads from history.")
        
        return {
            "status": "success",
            "data": results,
            "meta": {
                "count": len(results),
                "query": saved_entry.get("keyword", ""),
                "sort": "history_replay",
                "source": "database"
            }
        }

    except Exception as e:
        print(f"History Fetch Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")


# --- BESTEHENDE LIVE-SUCHE ---
@router.post("/")
async def search_ads(
    request: SearchRequest,
    background_tasks: BackgroundTasks, # Ermöglicht Speichern ohne Wartezeit für User
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Search '{request.keyword}' | Country: {request.country} | Sort: {request.sort_by}")

    results = []

    try:
        # 1. META / FACEBOOK SEARCH
        if request.platform == "meta" or request.platform == "both":
            meta_results = await apify_meta.search_meta_ads(
                query=request.keyword,
                country=request.country,
                limit=request.limit,
                start_date_min=request.start_date_min,
                start_date_max=request.start_date_max,
                active_status=request.active_status
            )
            
            # Platform-Tag normalisieren für Frontend & DB
            for ad in meta_results:
                if not ad.get('publisher_platform'): 
                    ad['publisher_platform'] = ['facebook', 'instagram']
            
            results.extend(meta_results)

        # 2. TIKTOK SEARCH
        if request.platform == "tiktok" or request.platform == "both":
            tiktok_results = await apify_tiktok.search_tiktok_ads(
                query=request.keyword,
                limit=request.limit
            )
            results.extend(tiktok_results)
        
        # 3. BACKGROUND TASK: ERGEBNISSE FÜR FEED SPEICHERN
        # Wir übergeben die Daten an den Supabase Service, damit der Feed gefüllt wird.
        if results:
            background_tasks.add_task(
                save_search_results, 
                platform=request.platform, 
                keyword=request.keyword,
                country=request.country,
                results=results
            )

        return {
            "status": "success", 
            "data": results,
            "meta": {
                "count": len(results),
                "query": request.keyword,
                "sort": request.sort_by
            }
        }

    except Exception as e:
        print(f"Router Error: {str(e)}")
        # Detaillierter Error für Debugging
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")