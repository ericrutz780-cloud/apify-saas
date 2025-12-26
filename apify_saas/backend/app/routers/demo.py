from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import apify_demo_service

router = APIRouter()

class DemoSearchRequest(BaseModel):
    keyword: str
    country: str = "US"
    limit: int = 30 

@router.post("/search")
async def demo_search_ads(request: DemoSearchRequest):
    print(f"DEMO ROUTER: Searching for '{request.keyword}'")
    try:
        # Hier rufen wir den neuen Service auf, der das Limit beachtet
        results = await apify_demo_service.search_demo_ads(
            query=request.keyword,
            country=request.country,
            limit=request.limit
        )
        return {
            "status": "success",
            "data": results,
            "meta": {"count": len(results)}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))