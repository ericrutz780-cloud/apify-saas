from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio

# Wir importieren die Services, die die eigentliche Arbeit machen
from services import apify_meta, apify_tiktok

router = APIRouter()

# Das Datenmodell für die Suchanfrage (entspricht dem JSON Body vom Frontend)
class SearchRequest(BaseModel):
    query: str
    platform: str          # 'meta', 'tiktok' oder 'both'
    limit: int = 20
    country: str = "US"    # Default Land, falls keines gewählt wurde

@router.post("/")
async def search_ads(
    request: SearchRequest,
    user_id: str = Query(..., description="Die ID des Users, um Credits abzuziehen (wird später implementiert)")
):
    """
    Zentraler Endpunkt für die Werbeanzeigen-Suche.
    Verteilt die Anfrage an Meta und/oder TikTok Services.
    """
    print(f"DEBUG: API Search Request erhalten")
    print(f"       Query: {request.query}")
    print(f"       Platform: {request.platform}")
    print(f"       Country: {request.country}") # Hier prüfen wir im Log, ob 'DE' ankommt!
    print(f"       Limit: {request.limit}")

    results = []

    try:
        # --- META SEARCH (Facebook/Instagram) ---
        if request.platform == "meta" or request.platform == "both":
            print("--> Starte Meta Suche...")
            # WICHTIG: Hier übergeben wir 'request.country' an den Service!
            meta_results = await apify_meta.search_meta_ads(
                query=request.query,
                country=request.country, 
                limit=request.limit
            )
            # Wir markieren die Ergebnisse zur Sicherheit, falls nicht schon geschehen
            for ad in meta_results:
                # Fallback, falls der Adapter das nicht gesetzt hat
                if not ad.get('platform'): 
                    ad['platform'] = ['facebook', 'instagram'] 
            
            results.extend(meta_results)

        # --- TIKTOK SEARCH ---
        if request.platform == "tiktok" or request.platform == "both":
            print("--> Starte TikTok Suche...")
            # TikTok hat aktuell keine Länder-Filterung im einfachen Scraper, 
            # daher übergeben wir nur Query und Limit.
            tiktok_results = await apify_tiktok.search_tiktok_ads(
                query=request.query, 
                limit=request.limit
            )
            results.extend(tiktok_results)

        print(f"DEBUG: Suche abgeschlossen. {len(results)} Treffer gesamt.")
        
        return {
            "status": "success", 
            "data": results,
            "meta": {
                "count": len(results),
                "query": request.query,
                "country": request.country
            }
        }

    except Exception as e:
        print(f"CRITICAL ERROR in search_ads router: {str(e)}")
        # Wir werfen einen HTTP 500 Fehler, damit das Frontend Bescheid weiß
        raise HTTPException(status_code=500, detail=str(e))