from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.models.api_requests import SearchRequest
from app.services import apify_meta, apify_tiktok
from app.services.supabase_service import create_search_record, save_search_details, supabase
# FIX: UUID Import hinzugefügt
import uuid 

router = APIRouter()

# --- RERUN ENDPOINT ---
@router.get("/history/{search_id}")
async def get_search_history(
    search_id: str,
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Rerun Search ID '{search_id}' for User: {user_id}")
    
    # FIX: Verhindert Absturz bei alten Browser-Daten (Invalid UUID)
    try:
        uuid.UUID(search_id)
    except ValueError:
        return {
            "status": "error",
            "data": [],
            "meta": {"count": 0, "error": "Invalid ID ignored", "search_id": search_id}
        }

    try:
        # 1. Metadaten (Query, Country) laden
        parent_res = supabase.table("search_cache").select("*").eq("id", search_id).execute()
        if not parent_res.data:
             # Statt 404 lieber leeres Ergebnis, um Frontend-Crash zu vermeiden
             return {"status": "success", "data": [], "meta": {"count": 0}}
        
        search_meta = parent_res.data[0]
        
        # 2. Ergebnisse laden
        response = supabase.table("ad_results").select("data").eq("search_ref", search_id).execute()
        results = [row['data'] for row in response.data] if response.data else []
        
        print(f"✅ Loaded {len(results)} ads from history.")
        
        return {
            "status": "success",
            "data": results,
            "meta": {
                "count": len(results),
                "query": search_meta.get("query", ""),
                "sort": "history_replay",
                "source": "database",
                "search_id": search_id
            }
        }

    except Exception as e:
        print(f"History Fetch Error: {str(e)}")
        # FIX: Kein 500er Error werfen, sondern leeres Array zurückgeben, damit UI nicht crasht
        return {"status": "error", "data": [], "meta": {"error": str(e)}}


# --- LIVE SEARCH ENDPOINT ---
@router.post("/")
async def search_ads(
    request: SearchRequest,
    background_tasks: BackgroundTasks, 
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Live Search '{request.keyword}' | Country: {request.country}")

    results = []

    try:
        # 1. META / FACEBOOK SEARCH
        if request.platform == "meta" or request.platform == "both":
            # await ist korrekt, da apify_meta.search_meta_ads async ist
            meta_results = await apify_meta.search_meta_ads(
                query=request.keyword,
                country=request.country,
                limit=request.limit,
                start_date_min=request.start_date_min,
                start_date_max=request.start_date_max,
                active_status=request.active_status
            )
            
            # Platform Tagging sicherstellen
            if meta_results:
                for ad in meta_results:
                    if not ad.get('publisher_platform'): 
                        ad['publisher_platform'] = ['facebook', 'instagram']
                results.extend(meta_results)

        # 2. TIKTOK SEARCH
        if request.platform == "tiktok" or request.platform == "both":
            if apify_tiktok:
                tiktok_results = await apify_tiktok.search_tiktok_ads(
                    query=request.keyword,
                    limit=request.limit
                )
                results.extend(tiktok_results)
        
        # 3. SPEICHERN & ID ERSTELLEN
        search_id = None
        if results:
            # Synchron: ID für das Frontend erstellen
            search_id = create_search_record(request.platform, request.keyword, request.country)
            
            # Asynchron: Die eigentlichen Daten speichern
            if search_id:
                background_tasks.add_task(
                    save_search_details, 
                    search_id=search_id,
                    platform=request.platform, 
                    results=results
                )

        # FIX: Meta-Objekt hinzugefügt, das Types.ts jetzt erwartet
        return {
            "status": "success", 
            "data": results,
            "meta": {
                "count": len(results),
                "query": request.keyword,
                "sort": request.sort_by,
                "source": "live",
                "search_id": search_id 
            }
        }

    except Exception as e:
        print(f"Router Error: {str(e)}")
        # Fehler abfangen statt Server Crash
        return {"status": "error", "data": [], "meta": {"error": str(e)}}