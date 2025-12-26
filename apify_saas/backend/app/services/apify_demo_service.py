from apify_client import ApifyClient
from app.core.config import settings
import asyncio
import logging
import math
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demo_service")

client = ApifyClient(settings.APIFY_TOKEN)

def get_nested_value(ad, path_list):
    current = ad
    for key in path_list:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return current

def calculate_simple_score(reach, days_active):
    if days_active < 1: days_active = 1
    if not reach or reach <= 0: return 0.0
    
    velocity = reach / days_active
    # Logarithmische Skala für realistische Verteilung (nicht alles 100)
    score = 10 * math.log2(1 + velocity)
    return round(min(score, 100), 1)

async def search_demo_ads(query: str, country: str = "US", limit: int = 30):
    target_country = country.upper() if country and country != "ALL" else "US"
    
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&media_type=all"
    )

    run_input = {
        "urls": [{"url": search_url}],
        "resultsLimit": limit,
        "maxItems": limit,     
        "pageTimeoutSecs": 30,
        "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    logger.info(f"DEMO SEARCH: '{query}' LIMIT={limit}")

    try:
        loop = asyncio.get_event_loop()
        
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512,
            timeout_secs=120
        ))
        
        if not run: return []

        dataset_id = run.get("defaultDatasetId")
        if not dataset_id: return []

        dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True, limit=limit).items)
        
        results = []
        for item in dataset_items:
            if len(results) >= limit: break
            
            snapshot = item.get("snapshot") or {}
            start_date = item.get("start_date", "")
            
            # --- REACH EXTRACTION (ROBUST - wie in apify_meta.py) ---
            reach = 0
            
            # 1. EU Transparency (Root)
            reach = get_nested_value(item, ['eu_transparency', 'eu_total_reach'])
            
            # 2. AAA Info (oft versteckt hier)
            if not reach: 
                reach = get_nested_value(item, ['aaa_info', 'eu_total_reach'])
            
            # 3. Transparency by Location
            if not reach: 
                reach = get_nested_value(item, ['transparency_by_location', 'eu_transparency', 'eu_total_reach'])
            
            # 4. Reach Estimate (Fallback)
            if not reach:
                est = item.get('reach_estimate')
                if isinstance(est, dict): 
                    reach = est.get('reach_upper_bound')
                elif isinstance(est, (int, float)):
                    reach = est
            
            # 5. Impressions Index (Letzter Ausweg)
            if not reach:
                reach = get_nested_value(item, ['impressions_with_index', 'impressions_index'])

            # Sicherstellen, dass Reach int ist
            final_reach = int(reach) if reach else 0

            # Days Active berechnen
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d") if len(start_date) == 10 else datetime.now()
                days = max(1, (datetime.now() - start_dt).days)
            except: days = 1

            if snapshot.get("images") or snapshot.get("videos") or snapshot.get("cards"):
                # Score berechnen (nur wenn Reach da ist, sonst 0 -> sieht realistisch aus)
                score = calculate_simple_score(final_reach, days)
                
                results.append({
                    "id": str(item.get("ad_archive_id") or item.get("ad_id")),
                    "page_name": item.get("page_name", "Unknown"),
                    "start_date": start_date,
                    "efficiency_score": score,
                    "snapshot": snapshot,
                    "targeting": {"reach_estimate": final_reach} 
                })

        return results[:limit]

    except Exception as e:
        logger.error(f"DEMO ERROR: {str(e)}")
        return []