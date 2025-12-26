from apify_client import ApifyClient
from app.core.config import settings
import asyncio
import logging
import math
import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demo_service")

client = ApifyClient(settings.APIFY_TOKEN)

# --- 1:1 KOPIE DER HILFSFUNKTIONEN AUS DER OFFIZIELLEN APP (apify_meta.py) ---

def get_nested_value(ad, path_list):
    current = ad
    for key in path_list:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return current

def get_page_size(item):
    """Ermittelt die Macht des Profils (Likes + Follower)."""
    likes = item.get("likes", 0) or item.get("page_like_count", 0)
    advertiser = item.get("advertiser", {})
    page_info = advertiser.get("ad_library_page_info", {}).get("page_info", {})
    
    if not likes: likes = page_info.get("likes", 0) or 0
    ig_followers = page_info.get("ig_followers", 0) or 0
    if not likes: likes = item.get("snapshot", {}).get("page_like_count", 0) or 0

    return (int(likes or 0) + int(ig_followers or 0))

def get_advertiser_info(item):
    page_info = item.get("advertiser", {}).get("ad_library_page_info", {}).get("page_info", {})
    about_text = item.get("advertiser", {}).get("page", {}).get("about", {}).get("text")
    return {
        "facebook_handle": page_info.get("page_alias"),
        "facebook_followers": page_info.get("likes"),
        "instagram_handle": page_info.get("ig_username"),
        "instagram_followers": page_info.get("ig_followers"),
        "about_text": about_text,
        "category": page_info.get("page_category")
    }

def get_days_active(start_timestamp):
    if not start_timestamp: return 1.0
    try:
        if isinstance(start_timestamp, str):
            if len(start_timestamp) == 10: 
                start_date = datetime.datetime.strptime(start_timestamp, "%Y-%m-%d")
            else: 
                start_date = datetime.datetime.fromisoformat(start_timestamp.replace('Z', '+00:00'))
        elif isinstance(start_timestamp, (int, float)):
            start_date = datetime.datetime.fromtimestamp(int(start_timestamp))
        else:
            return 1.0
        now = datetime.datetime.now()
        delta = now - start_date
        return max(0.5, delta.total_seconds() / 86400)
    except:
        return 1.0

def get_time_cohort(days):
    if days <= 3: return "LAUNCH"      
    if days <= 14: return "TRENDING"   
    if days <= 30: return "ESTABLISHED"
    return "EVERGREEN"                 

def get_ad_cluster(ad):
    cats = ad.get("page_categories", [])
    if not cats: cats = []
    cats_str = str(cats).lower()
    
    snapshot = ad.get("snapshot") or {}
    cta = snapshot.get("cta_text")
    if not cta: cta = ""
    cta = str(cta).lower()
    
    service_keywords = ['medical', 'doctor', 'software', 'real estate', 'consulting', 'education', 'lawyer', 'dentist', 'service', 'health/beauty', 'employment', 'job', 'karriere', 'b2b', 'agency', 'business']
    if any(k in cats_str for k in service_keywords) or cta in ['book now', 'contact us', 'apply now']:
        return 'B'
        
    viral_keywords = ['media', 'news', 'blog', 'creator', 'comedian', 'gamer', 'just for fun', 'entertainment', 'meme']
    if any(k in cats_str for k in viral_keywords) or cta in ['watch more', 'like page']:
        return 'C'
        
    return 'A'

def calculate_log_score(value):
    if value <= 0: return 0
    score = 18 * math.log2(1 + value)
    return round(min(score, 100), 1)

def get_demographics(ad):
    breakdown = get_nested_value(ad, ['aaa_info', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['transparency_by_location', 'eu_transparency', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['eu_data', 'age_country_gender_reach_breakdown'])
    return breakdown or []

def normalize_meta_ad_demo(item):
    """
    Lokale Normalisierung für Demo (basierend auf der offiziellen App Logic).
    """
    if not item: return None
    
    raw_id = item.get("ad_archive_id") or item.get("ad_id")
    if not raw_id: return None
    safe_id = str(raw_id)

    # --- REICHWEITE (Robust) ---
    reach = 0
    reach = get_nested_value(item, ['eu_transparency', 'eu_total_reach'])
    if not reach: reach = get_nested_value(item, ['aaa_info', 'eu_total_reach'])
    if not reach: reach = get_nested_value(item, ['transparency_by_location', 'eu_transparency', 'eu_total_reach'])
    if not reach:
        reach_est = item.get('reach_estimate')
        if isinstance(reach_est, dict): reach = reach_est.get('reach_upper_bound')
        elif isinstance(reach_est, (int, float)): reach = reach_est
    
    final_reach = int(reach) if reach else 0

    # --- METRIKEN ---
    page_size = get_page_size(item)
    safe_audience = max(page_size, 1000) 
    viral_ratio = final_reach / safe_audience
    
    start_date_ts = item.get("start_date") 
    days_active = get_days_active(start_date_ts)
    viral_velocity = viral_ratio / days_active 
    
    raw_snapshot = item.get("snapshot") or {}
    
    page_cats = item.get("categories", [])
    if raw_snapshot.get("page_categories"):
        cats = raw_snapshot.get("page_categories")
        if isinstance(cats, dict): page_cats = list(cats.values())
        elif isinstance(cats, list): page_cats = cats

    return {
        "id": safe_id,
        "publisher_platform": item.get("publisher_platform", ["facebook"]),
        "start_date": item.get("start_date", ""),
        "page_name": item.get("page_name", "Unknown Page"),
        "page_size": page_size,
        "reach_estimate": final_reach, # Wichtig für Frontend
        "viral_ratio": viral_ratio, 
        "days_active": days_active,
        "viral_velocity": viral_velocity,
        "page_categories": page_cats,
        "snapshot": raw_snapshot,
        "targeting": {"reach_estimate": final_reach} # Kompatibilität
    }

async def search_demo_ads(query: str, country: str = "US", limit: int = 30):
    target_country = country.upper() if country and country != "ALL" else "US"
    
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&media_type=all"
    )

    # --- LIMITS: ALLES SETZEN WAS MÖGLICH IST ---
    # Hier werden alle Parameter gesetzt, damit der Scraper garantiert stoppt.
    run_input = {
        "urls": [{"url": search_url}],
        "limitPerSource": limit, # <--- WICHTIG: Stoppt pro URL
        "resultsLimit": limit,   # Actor Limit
        "maxItems": limit,       # Apify System Limit
        "count": limit,          # Legacy Parameter
        "pageTimeoutSecs": 25,
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
            timeout_secs=180 # 3 Minuten Hard Limit
        ))
        
        if not run: return []

        dataset_id = run.get("defaultDatasetId")
        if not dataset_id: return []

        dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True, limit=limit).items)
        
        # --- NORMALISIERUNG & FILTERUNG ---
        results_pool = []
        for item in dataset_items:
            norm = normalize_meta_ad_demo(item)
            if norm:
                # Prüfen auf Content
                snap = norm.get("snapshot", {})
                if snap.get("images") or snap.get("videos") or snap.get("cards"):
                    results_pool.append(norm)
        
        if not results_pool: return []

        # --- OFFIZIELLE SCORING LOGIK (V3 ALGO) ---
        cohort_buckets = {}
        for ad in results_pool:
            cat_cluster = get_ad_cluster(ad)
            time_cohort = get_time_cohort(ad['days_active'])
            bucket_key = f"{cat_cluster}_{time_cohort}"
            ad['_bucket'] = bucket_key
            if bucket_key not in cohort_buckets: cohort_buckets[bucket_key] = []
            cohort_buckets[bucket_key].append(ad['viral_velocity'])

        bucket_avgs = {}
        for key, velocities in cohort_buckets.items():
            bucket_avgs[key] = sum(velocities) / len(velocities) if velocities else 0.1

        global_total = sum(ad['viral_ratio'] for ad in results_pool)
        global_avg = global_total / len(results_pool) if results_pool else 1.0
        if global_avg < 0.1: global_avg = 0.1

        for ad in results_pool:
            velocity = ad['viral_velocity']
            bucket = ad['_bucket']
            count_in_bucket = len(cohort_buckets[bucket])
            
            norm_factor = 1.0
            if count_in_bucket >= 3:
                benchmark = max(bucket_avgs[bucket], 0.05)
                norm_factor = 2.0 / benchmark 
            else:
                cluster_char = bucket.split('_')[0]
                if cluster_char == 'B': norm_factor = 3.0 
                elif cluster_char == 'C': norm_factor = 0.5 
                else: norm_factor = 1.0
            
            if norm_factor > 10.0: norm_factor = 10.0
            
            # Hier entsteht der finale Score basierend auf der offiziellen Formel
            adjusted_val = velocity * norm_factor * 5 
            ad['efficiency_score'] = calculate_log_score(adjusted_val)
            ad['viral_factor'] = round(ad['viral_ratio'] / global_avg, 1)

        # Sortieren
        results_pool.sort(key=lambda x: (x.get('efficiency_score') or 0), reverse=True)
        return results_pool[:limit]

    except Exception as e:
        logger.error(f"DEMO ERROR: {str(e)}")
        return []