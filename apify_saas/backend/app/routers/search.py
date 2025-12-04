from fastapi import APIRouter, HTTPException
from app.models.api_requests import SearchQuery
from app.services.apify_meta import fetch_meta_ads_live
from app.services.apify_tiktok import fetch_tiktok_viral_live
from app.services.supabase_service import save_search_results, deduct_credits, check_user_credits
import uuid

router = APIRouter()

@router.post("/")
def search_ads(query: SearchQuery, user_id: str = "test_user"):
    try:
        # 1. Credits Check
        if not check_user_credits(user_id, query.limit):
            raise HTTPException(status_code=402, detail="Nicht genügend Credits. Bitte aufladen.")

        # 2. Live API
        results = []
        if query.platform == "meta":
            results = fetch_meta_ads_live(query.keyword, query.country, query.limit, query.sort_by)
        elif query.platform == "tiktok":
            results = fetch_tiktok_viral_live(query.keyword, query.limit)
        
        # 3. Speichern & Abrechnen
        if results:
            save_search_results(query.platform, query.keyword, results)
            deduct_credits(user_id, query.limit)

        # 4. Antwort bauen (HIER WAR DER FEHLER)
        # Wir müssen 'metaAds' oder 'tikTokAds' zurückgeben, damit das Frontend sie findet.
        
        response = {
            "id": str(uuid.uuid4()), # Eine ID für die Suche generieren
            "status": "success",
            "source": "api",
            "count": len(results),
            "params": query.dict(), # Damit das Frontend weiß, wonach gesucht wurde
            
            # WICHTIG: Daten in das richtige Feld packen!
            "metaAds": results if query.platform == "meta" else [],
            "tikTokAds": results if query.platform == "tiktok" else [],
            
            # Legacy Feld (falls was anderes noch drauf zugreift)
            "data": results 
        }
        
        return response
        
    except Exception as e:
        print(f"Search Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))