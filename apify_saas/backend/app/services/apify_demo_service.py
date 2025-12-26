from apify_client import ApifyClient
from app.core.config import settings
import asyncio
import logging
import math
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demo_service")

client = ApifyClient(settings.APIFY_TOKEN)

def calculate_simple_score(reach, days_active):
    if days_active < 1: days_active = 1
    velocity = reach / days_active
    return round(min(15 * math.log2(1 + velocity) if velocity > 0 else 0, 100), 1)

async def search_demo_ads(query: str, country: str = "US", limit: int = 30):
    target_country = country.upper() if country and country != "ALL" else "US"
    
    # URL
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&media_type=all"
    )

    # NOTBREMSE: Wir setzen ALLE Limit-Parameter, die es gibt.
    run_input = {
        "urls": [{"url": search_url}],
        "resultsLimit": limit, # Oft genutzt von Ad Scrapern
        "maxItems": limit,     # Apify Standard
        "count": limit,        # Fallback
        "pageTimeoutSecs": 30, # Schneller Timeout
        "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    logger.info(f"DEMO SEARCH: '{query}' (Limit: {limit})")

    try:
        loop = asyncio.get_event_loop()
        
        # Starten mit striktem Timeout auf Server-Ebene
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512,
            timeout_secs=120 # Kill nach 2 Minuten hart
        ))
        
        if not run: return []

        dataset_id = run.get("defaultDatasetId")
        if not dataset_id: return []

        # Daten laden
        dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True, limit=limit).items)
        
        results = []
        for item in dataset_items:
            # Harter Stop wenn wir genug haben
            if len(results) >= limit: break
            
            snapshot = item.get("snapshot") or {}
            start_date = item.get("start_date", "")
            
            # Reach Check
            reach = item.get('eu_transparency', {}).get('eu_total_reach')
            if not reach: reach = item.get('reach_estimate', {}).get('reach_upper_bound') if isinstance(item.get('reach_estimate'), dict) else 0
            
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d") if len(start_date) == 10 else datetime.now()
                days = max(1, (datetime.now() - start_dt).days)
            except: days = 1

            # Nur gültige Ads
            if snapshot.get("images") or snapshot.get("videos") or snapshot.get("cards"):
                results.append({
                    "id": str(item.get("ad_archive_id") or item.get("ad_id")),
                    "page_name": item.get("page_name", "Unknown"),
                    "start_date": start_date,
                    "efficiency_score": calculate_simple_score(reach or 0, days),
                    "snapshot": snapshot,
                    "targeting": {"reach_estimate": reach}
                })

        return results[:limit]

    except Exception as e:
        logger.error(f"DEMO ERROR: {str(e)}")
        return []