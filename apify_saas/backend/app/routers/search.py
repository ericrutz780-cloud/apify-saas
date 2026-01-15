from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.models.api_requests import SearchRequest
from app.services import apify_meta, apify_tiktok
from app.services.supabase_service import create_search_record, save_search_details, supabase

router = APIRouter()

# --- RERUN ENDPOINT (Lädt Cache/History) ---
@router.get("/history/{search_id}")
async def get_search_history(
    search_id: str,
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Rerun Search ID '{search_id}' for User: {user_id}")
    
    try:
        # Holt den Parent-Eintrag um Query-Metadaten zu bekommen
        parent_res = supabase.table("search_cache").select("*").eq("id", search_id).execute()
        if not parent_res.data:
             # Fallback: Vielleicht existiert die ID nicht, Fehlermeldung
             raise HTTPException(status_code=404, detail="Search history not found")
        
        search_meta = parent_res.data[0]
        
        # Holt die Ergebnisse
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
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")


# --- LIVE SEARCH ENDPOINT (Immer Live, kein Auto-Cache) ---
@router.post("/")
async def search_ads(
    request: SearchRequest,
    background_tasks: BackgroundTasks, 
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Live Search '{request.keyword}' | Country: {request.country}")

    results = []

    try:
        # 1. META / FACEBOOK SEARCH (Immer Live)
        if request.platform == "meta" or request.platform == "both":
            meta_results = await apify_meta.search_meta_ads(
                query=request.keyword,
                country=request.country,
                limit=request.limit,
                start_date_min=request.start_date_min,
                start_date_max=request.start_date_max,
                active_status=request.active_status
            )
            
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
        
        # 3. DB SAVE & RETURN ID
        # Wir erstellen den DB-Eintrag sofort, um die ID zu bekommen
        search_id = None
        if results:
            # Synchron: ID holen
            search_id = create_search_record(request.platform, request.keyword, request.country)
            
            # Asynchron: Details speichern
            if search_id:
                background_tasks.add_task(
                    save_search_details, 
                    search_id=search_id,
                    platform=request.platform, 
                    results=results
                )

        return {
            "status": "success", 
            "data": results,
            "meta": {
                "count": len(results),
                "query": request.keyword,
                "sort": request.sort_by,
                "source": "live",
                "search_id": search_id # WICHTIG: Frontend braucht diese ID für Rerun!
            }
        }

    except Exception as e:
        print(f"Router Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")