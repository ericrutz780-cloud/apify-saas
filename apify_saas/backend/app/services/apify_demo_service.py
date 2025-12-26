from apify_client import ApifyClient
from app.core.config import settings
import asyncio
import logging
import math
from datetime import datetime

# Eigener Logger für Demo
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demo_service")

client = ApifyClient(settings.APIFY_TOKEN)

# --- Hilfsfunktionen (Kopie aus meta, damit wir keine Abhängigkeiten haben) ---
def get_nested_value(ad, path_list):
    current = ad
    for key in path_list:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return current

def calculate_simple_score(reach, days_active):
    # Vereinfachtes Scoring für die Demo (schneller)
    if days_active < 1: days_active = 1
    velocity = reach / days_active
    if velocity <= 0: return 0
    score = 15 * math.log2(1 + velocity)
    return round(min(score, 100), 1)

async def search_demo_ads(query: str, country: str = "US", limit: int = 30):
    """
    Spezielle Suchfunktion für die Demo.
    Respektiert STRIKT das Limit, um Kosten zu sparen.
    """
    target_country = country.upper() if country and country != "ALL" else "US"
    
    # 1. Such-URL konstruieren
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active" 
        f"&ad_type=all"
        f"&country={target_country}"
        f"&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"
        f"&media_type=all"
    )

    # 2. Apify Input Konfiguration
    # HIER IST DER FIX: Wir nutzen das 'limit' Argument direkt für 'count' und 'maxItems'
    run_input = {
        "urls": [{"url": search_url}],
        "count": limit,      # <--- LIMIT WIRD HIER GENUTZT
        "maxItems": limit,   # <--- HARD LIMIT
        "pageTimeoutSecs": 45,
        "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    logger.info(f"DEMO SEARCH: '{query}' in {target_country} with LIMIT={limit}")

    try:
        loop = asyncio.get_event_loop()
        
        # 3. Scraper starten
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512,
            timeout_secs=180 # Kürzerer Timeout für Demo
        ))
        
        if not run:
            return []

        dataset_id = run.get("defaultDatasetId")
        if not dataset_id:
            return []

        # 4. Daten holen
        dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True).items)
        
        # 5. Minimale Aufbereitung für Demo
        results = []
        for item in dataset_items:
            # Quick & Dirty Normalisierung für die Demo-Anzeige
            snapshot = item.get("snapshot") or {}
            start_date = item.get("start_date", "")
            
            # Reach berechnen (Fallback Kette)
            reach = get_nested_value(item, ['eu_transparency', 'eu_total_reach'])
            if not reach: reach = item.get('reach_estimate', {}).get('reach_upper_bound') if isinstance(item.get('reach_estimate'), dict) else 0
            
            # Days Active
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d") if len(start_date) == 10 else datetime.now()
                days_active = max(1, (datetime.now() - start_dt).days)
            except:
                days_active = 1

            ad_obj = {
                "id": str(item.get("ad_archive_id") or item.get("ad_id")),
                "page_name": item.get("page_name", "Unknown Brand"),
                "start_date": start_date,
                "efficiency_score": calculate_simple_score(reach or 0, days_active), # Simple Score
                "snapshot": {
                    "images": snapshot.get("images") or [],
                    "videos": snapshot.get("videos") or [],
                    "cards": snapshot.get("cards") or [],
                    "body": {"text": snapshot.get("body", {}).get("text") or ""},
                    "cta_text": snapshot.get("cta_text", "Learn More"),
                    "link_url": snapshot.get("link_url") or "#"
                },
                "targeting": {"reach_estimate": reach}
            }
            
            # Nur Ads mit Bild/Video aufnehmen
            if ad_obj["snapshot"]["images"] or ad_obj["snapshot"]["videos"] or ad_obj["snapshot"]["cards"]:
                results.append(ad_obj)

        # Sortieren nach Score
        results.sort(key=lambda x: x['efficiency_score'], reverse=True)
        
        # Zur Sicherheit nochmal abschneiden
        return results[:limit]

    except Exception as e:
        logger.error(f"DEMO ERROR: {str(e)}")
        return []