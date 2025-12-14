from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.services import apify_meta, apify_tiktok

router = APIRouter()

class SearchRequest(BaseModel):
    keyword: str
    platform: str
    limit: int = 20
    country: str = "US"
    # NEU: Felder für Filter
    start_date_min: Optional[str] = None
    start_date_max: Optional[str] = None
    active_status: Optional[str] = "active"

@router.post("/")
async def search_ads(
    request: SearchRequest,
    user_id: str = Query(..., description="User ID")
):
    print(f"API ROUTER: Search '{request.keyword}' | Country: {request.country} | Date: {request.start_date_min}")

    results = []

    try:
        if request.platform == "meta" or request.platform == "both":
            meta_results = await apify_meta.search_meta_ads(
                query=request.keyword,
                country=request.country,
                limit=request.limit,
                # NEU: Parameter durchreichen
                start_date_min=request.start_date_min,
                start_date_max=request.start_date_max,
                active_status=request.active_status
            )
            for ad in meta_results:
                if not ad.get('platform'): ad['publisher_platform'] = ['facebook', 'instagram']
            results.extend(meta_results)

        if request.platform == "tiktok" or request.platform == "both":
            tiktok_results = await apify_tiktok.search_tiktok_ads(
                query=request.keyword,
                limit=request.limit
            )
            results.extend(tiktok_results)
        
        return {
            "status": "success", 
            "data": results,
            "meta": {
                "count": len(results),
                "query": request.keyword
            }
        }

    except Exception as e:
        print(f"Router Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))