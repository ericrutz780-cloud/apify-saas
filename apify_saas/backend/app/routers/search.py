from fastapi import APIRouter, HTTPException
from app.models.api_requests import SearchQuery

# Import der Scraping-Services
from app.services.apify_meta import fetch_meta_ads_live
from app.services.apify_tiktok import fetch_tiktok_viral_live

# Import der Datenbank-Services (Caching & Credits)
from app.services.supabase_service import get_cached_results, save_search_results, deduct_credits, check_user_credits

router = APIRouter()

@router.post("/")
def search_ads(query: SearchQuery):
    try:
        # ---------------------------------------------------------
        # SCHRITT 1: Cache prüfen (Tier 2 - Gratis & Schnell)
        # ---------------------------------------------------------
        # Wir schauen zuerst in Supabase, ob wir die Daten schon haben (jünger als 24h).
        cached_data = get_cached_results(query.platform, query.keyword)
        
        if cached_data:
            # TREFFER! Wir sparen uns den API-Call.
            return {
                "status": "success",
                "source": "cache",
                "count": len(cached_data),
                "data": cached_data
            }

        # ---------------------------------------------------------
        # SCHRITT 2: Live API Call (Tier 1 - Kostet uns Geld)
        # ---------------------------------------------------------
        # Wenn nichts im Cache war, müssen wir Apify rufen.
        
        # TODO: Hier später 'check_user_credits(user_id, query.limit)' einfügen!
        
        results = []
        
        if query.platform == "meta":
            # Aufruf Facebook Scraper (URL Trick)
            results = fetch_meta_ads_live(query.keyword, query.country, query.limit)
            
        elif query.platform == "tiktok":
            # Aufruf TikTok Scraper (Hashtag Strategy)
            results = fetch_tiktok_viral_live(query.keyword, query.limit)
        
        # ---------------------------------------------------------
        # SCHRITT 3: Nachbereitung (Speichern & Abrechnen)
        # ---------------------------------------------------------
        if results:
            # A) Wir speichern das Ergebnis sofort für den nächsten Nutzer (Caching)
            save_search_results(query.platform, query.keyword, results)
            
            # B) TODO: Hier später 'deduct_credits(user_id, len(results))' einfügen!

        return {
            "status": "success",
            "source": "api", # Zeigt an, dass es frisch von Apify kam
            "count": len(results),
            "data": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))