from apify_client import ApifyClient
from app.core.config import settings
import asyncio
import logging
import math
from datetime import datetime

# Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demo_service")

client = ApifyClient(settings.APIFY_TOKEN)

def calculate_simple_score(reach, days_active):
    # Einfache Formel für Demo: Mehr Reach in kürzerer Zeit = Höherer Score
    if days_active < 1: days_active = 1
    # Schutz vor 0-Reach
    if not reach or reach < 100: reach = 1000 # Fallback für Demo
    
    velocity = reach / days_active
    score = 15 * math.log2(1 + velocity)
    return round(min(score, 100), 1)

async def search_demo_ads(query: str, country: str = "US", limit: int = 30):
    target_country = country.upper() if country and country != "ALL" else "US"
    
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&media_type=all"
    )

    # EXTREM STRIKTE LIMITS
    run_input = {
        "urls": [{"url": search_url}],
        "resultsLimit": limit, 
        "maxItems": limit,     
        "count": limit,        
        "pageTimeoutSecs": 20, # Sehr kurz halten
        "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    logger.info(f"DEMO SEARCH: '{query}' LIMIT={limit}")

    try:
        loop = asyncio.get_event_loop()
        
        # Start Scraper
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512,
            timeout_secs=90 # Hard Kill nach 90s
        ))
        
        if not run: return []

        dataset_id = run.get("defaultDatasetId")
        if not dataset_id: return []

        # Daten holen (nur so viele wie nötig)
        dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True, limit=limit).items)
        
        results = []
        for item in dataset_items:
            if len(results) >= limit: break
            
            snapshot = item.get("snapshot") or {}
            start_date = item.get("start_date", "")
            
            # --- REACH EXTRACTION (ROBUST) ---
            reach = 0
            # 1. Versuch: EU Transparency (oft am genausten)
            eu_transparency = item.get('eu_transparency', {})
            if not eu_transparency: eu_transparency = item.get('transparency_by_location', {}).get('eu_transparency', {})
            reach = eu_transparency.get('eu_total_reach')
            
            # 2. Versuch: Reach Estimate
            if not reach:
                est = item.get('reach_estimate')
                if isinstance(est, dict): reach = est.get('reach_upper_bound')
                elif isinstance(est, (int, float)): reach = est
            
            # 3. Versuch: Impressions (falls vorhanden)
            if not reach:
                reach = item.get('impressions_with_index', {}).get('impressions_index')

            # --- DURATION ---
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d") if len(start_date) == 10 else datetime.now()
                days = max(1, (datetime.now() - start_dt).days)
            except: days = 1

            # Nur Ads mit Bild/Video
            if snapshot.get("images") or snapshot.get("videos") or snapshot.get("cards"):
                # Score berechnen
                score = calculate_simple_score(reach, days)
                
                results.append({
                    "id": str(item.get("ad_archive_id") or item.get("ad_id")),
                    "page_name": item.get("page_name", "Unknown"),
                    "start_date": start_date,
                    "efficiency_score": score,
                    "snapshot": snapshot,
                    "targeting": {"reach_estimate": reach or 0} # 0 senden wenn nix da ist
                })

        return results[:limit]

    except Exception as e:
        logger.error(f"DEMO ERROR: {str(e)}")
        return []