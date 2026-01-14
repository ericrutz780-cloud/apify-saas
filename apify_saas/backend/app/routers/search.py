from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.models.api_requests import SearchRequest
from app.services import apify_meta, apify_tiktok
# Importiere die Cache-Funktionen aus dem Supabase Service
from app.services.supabase_service import save_search_results, get_cached_results

router = APIRouter()

@router.post("/")
async def search_ads(
    request: SearchRequest,
    background_tasks: BackgroundTasks, 
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Search '{request.keyword}' | Country: {request.country} | Sort: {request.sort_by}")

    results = []

    try:
        # 0. CACHE CHECK (Rerun-Optimierung)
        # Bevor wir scrapen, schauen wir in Supabase, ob wir die Daten schon haben.
        # Das macht "Rerun" sofort schnell und kostet keine Credits.
        if request.platform == "meta" or request.platform == "both":
            cached_data = get_cached_results("meta", request.keyword)
            if cached_data:
                print(f"🚀 RERUN: Returning {len(cached_data)} cached results from Supabase.")
                # Wenn wir Cache haben, geben wir ihn sofort zurück
                # (Wir filtern hier optional noch nach Country, falls nötig, aber meistens reicht der Keyword-Match)
                return {
                    "status": "success",
                    "data": cached_data,
                    "meta": {
                        "count": len(cached_data),
                        "query": request.keyword,
                        "sort": request.sort_by,
                        "source": "cache" # Frontend weiß Bescheid
                    }
                }

        # 1. META / FACEBOOK SEARCH (Live Scrape, falls kein Cache)
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
        
        # 3. BACKGROUND TASK: SPEICHERN
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
                "sort": request.sort_by,
                "source": "live"
            }
        }

    except Exception as e:
        print(f"Router Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")