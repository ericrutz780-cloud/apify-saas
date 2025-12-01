from fastapi import APIRouter, HTTPException
from app.models.api_requests import SearchQuery

# Services
from app.services.apify_meta import fetch_meta_ads_live
from app.services.apify_tiktok import fetch_tiktok_viral_live
from app.services.supabase_service import get_cached_results, save_search_results, deduct_credits, check_user_credits

router = APIRouter()

@router.post("/")
def search_ads(query: SearchQuery, user_id: str = "test_user"): 
    # Hinweis: user_id wird für MVP als Query-Param (oder hier Default) erwartet. 
    # Das Frontend schickt es im URL-Parameter mit.
    
    try:
        # 1. Credits prüfen
        if not check_user_credits(user_id, query.limit):
            raise HTTPException(status_code=402, detail="Nicht genügend Credits.")

        # 2. Cache prüfen
        cached_data = get_cached_results(query.platform, query.keyword)
        if cached_data:
            # Auch Cache kostet Credits abziehen
            deduct_credits(user_id, query.limit)
            return {
                "status": "success",
                "source": "cache",
                "count": len(cached_data),
                "data": cached_data
            }

        # 3. Live API Call (Apify)
        results = []
        if query.platform == "meta":
            results = fetch_meta_ads_live(query.keyword, query.country, query.limit)
        elif query.platform == "tiktok":
            results = fetch_tiktok_viral_live(query.keyword, query.limit)
        
        # 4. Speichern & Abrechnen
        if results:
            save_search_results(query.platform, query.keyword, results)
            deduct_credits(user_id, query.limit)

        return {
            "status": "success",
            "source": "api",
            "count": len(results),
            "data": results
        }
        
    except Exception as e:
        print(f"Search Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))