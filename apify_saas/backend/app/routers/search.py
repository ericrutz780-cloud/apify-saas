from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import uuid 
from app.services import apify_meta
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
    # 1. Credits
    if not check_user_credits(user_id, query.limit):
        raise HTTPException(status_code=402, detail="Nicht genügend Credits.")

    # 2. Cache
    if query.platform in ["meta", "tiktok"]:
        cached_ads = get_cached_results(query.platform, query.keyword)
        if cached_ads and len(cached_ads) >= (query.limit * 0.5): 
            deduct_credits(user_id, query.limit)
            return {
                "id": "cache-hit",
                "params": {"query": query.keyword, "country": query.country},
                "meta": {"count": len(cached_ads), "source": "cache", "search_id": "cache-hit"},
                "data": cached_ads
            }

    # 3. Live Suche
    results = []
    
    if query.platform == "meta" or query.platform == "both":
        try:
            meta_results = await apify_meta.search_meta_ads(
                query=query.keyword, limit=query.limit, country=query.country,
                start_date_min=query.start_date_min, start_date_max=query.start_date_max,
                active_status=query.active_status
            )
            if meta_results: results.extend(meta_results)
        except Exception as e:
            print(f"Meta Error: {e}")

    if (query.platform == "tiktok" or query.platform == "both") and apify_tiktok:
        try:
            tiktok_results = await apify_tiktok.search_tiktok_ads(query.keyword, query.limit)
            if tiktok_results: results.extend(tiktok_results)
        except Exception as e:
            print(f"TikTok Error: {e}")

    search_id = None
    if results:
        deduct_credits(user_id, query.limit)
        search_id = create_search_record(query.platform, query.keyword, query.country)
        if search_id:
            background_tasks.add_task(save_search_details, search_id, query.platform, results)

    # FIX: meta-Objekt zurückgeben!
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
    # FIX: UUID Schutz
    try:
        uuid.UUID(search_id)
    except ValueError:
        return {"meta": {"count": 0, "error": "Invalid ID ignored"}, "data": []}

    client = get_supabase()
    
    search_meta = {}
    try:
        meta_res = client.table("search_cache").select("*").eq("id", search_id).maybe_single().execute()
        if meta_res.data: search_meta = meta_res.data
    except: pass

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
            "meta": {"count": len(ads), "query": "history", "search_id": search_id},
            "data": ads
        }
    except Exception as e:
        return {"meta": {"count": 0, "error": str(e)}, "data": []}