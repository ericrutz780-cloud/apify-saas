from apify_client import ApifyClient
from app.core.config import settings
import datetime
import asyncio
import math
import time
import logging

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = ApifyClient(settings.APIFY_TOKEN)

# --- HELPER FUNCTIONS ---

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
    """Berechnet, wie viele Tage die Ad schon läuft (Minimum 0.5 Tage)."""
    if not start_timestamp:
        return 1.0
    try:
        # Fall 1: String (ISO Format)
        if isinstance(start_timestamp, str):
            try:
                if len(start_timestamp) == 10: # YYYY-MM-DD
                    start_date = datetime.datetime.strptime(start_timestamp, "%Y-%m-%d")
                else: # ISO mit Zeit
                    start_date = datetime.datetime.fromisoformat(start_timestamp.replace('Z', '+00:00'))
            except:
                return 1.0
        # Fall 2: Integer/Float (Unix Timestamp)
        elif isinstance(start_timestamp, (int, float)):
            start_date = datetime.datetime.fromtimestamp(int(start_timestamp))
        else:
            return 1.0
            
        now = datetime.datetime.now()
        delta = now - start_date
        # Falls start_date in der Zukunft liegt (Zeitzonen-Bug), setze auf 0.5
        days = max(0.5, delta.total_seconds() / 86400)
        return days
    except Exception as e:
        logger.warning(f"Error calculating days_active for {start_timestamp}: {e}")
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

def normalize_meta_ad(item):
    # Validierung: Hat das Item überhaupt Daten?
    if not item: return None
    
    raw_snapshot = item.get("snapshot") or {}
    raw_id = item.get("ad_archive_id") or item.get("ad_id")
    
    # Kritischer Check: Ohne ID können wir nichts tun
    if not raw_id or str(raw_id) == "nan": 
        # logger.warning("Item skipped: No ID found")
        return None 
    safe_id = str(raw_id)

    # --- REICHWEITE ---
    reach = 0
    reach = get_nested_value(item, ['eu_transparency', 'eu_total_reach'])
    if not reach: reach = get_nested_value(item, ['aaa_info', 'eu_total_reach'])
    if not reach: reach = get_nested_value(item, ['transparency_by_location', 'eu_transparency', 'eu_total_reach'])
    if not reach:
        reach_est = item.get('reach_estimate')
        if isinstance(reach_est, dict): reach = reach_est.get('reach_upper_bound')
        elif isinstance(reach_est, (int, float)): reach = reach_est
    if not reach:
        reach = get_nested_value(item, ['impressions_with_index', 'impressions_index'])
        if reach == -1: reach = 0
    
    # Fallback: Wenn Reach 0 ist, ist die Ad wertlos für die Berechnung? 
    # Nein, wir nehmen sie trotzdem mit, Score wird halt niedrig.
    reach = int(reach) if reach else 0

    # --- BASIS METRIKEN ---
    page_size = get_page_size(item)
    safe_audience = max(page_size, 1000) 
    viral_ratio = reach / safe_audience
    
    # --- ZEIT & GESCHWINDIGKEIT ---
    start_date_ts = item.get("start_date") 
    days_active = get_days_active(start_date_ts)
    viral_velocity = viral_ratio / days_active 
    
    advertiser_info = get_advertiser_info(item)
    demographics_raw = get_demographics(item)
    target_locations = get_nested_value(item, ['aaa_info', 'location_audience']) or []
    
    page_cats = item.get("categories", [])
    if raw_snapshot.get("page_categories"):
        cats = raw_snapshot.get("page_categories")
        if isinstance(cats, dict): page_cats = list(cats.values())
        elif isinstance(cats, list): page_cats = cats

    images = raw_snapshot.get("images") or []
    videos = raw_snapshot.get("videos") or []
    cards = raw_snapshot.get("cards") or []
    body_text = raw_snapshot.get("body", {}).get("text")
    if not body_text and cards and isinstance(cards[0], dict):
        body_text = cards[0].get("body")

    payer_beneficiary = get_nested_value(item, ['aaa_info', 'payer_beneficiary_data'])
    if payer_beneficiary and isinstance(payer_beneficiary, list) and len(payer_beneficiary) > 0:
        beneficiary_payer = {
            "payer": payer_beneficiary[0].get("payer"),
            "beneficiary": payer_beneficiary[0].get("beneficiary")
        }
    else:
        beneficiary_payer = None

    return {
        "id": safe_id,
        "publisher_platform": item.get("publisher_platform", ["facebook"]),
        "start_date": item.get("start_date", ""),
        "page_name": item.get("page_name", "Unknown Page"),
        "page_profile_uri": item.get("page_profile_uri", "#"),
        "ad_library_url": item.get("ad_library_url", "#"),
        "likes": item.get("likes", 0) or item.get("page_like_count", 0),
        "reach_estimate": reach, 
        "impressions": reach,
        "spend": item.get("spend", 0),
        "page_size": page_size,
        "viral_ratio": viral_ratio, 
        "days_active": days_active,
        "viral_velocity": viral_velocity,
        "efficiency_score": 0, 
        "viral_factor": 0,     
        "demographics": demographics_raw,
        "target_locations": target_locations,
        "advertiser_info": advertiser_info,
        "beneficiary_payer": beneficiary_payer,
        "page_categories": page_cats,
        "snapshot": {
            "cta_text": raw_snapshot.get("cta_text", "Learn More"),
            "link_url": raw_snapshot.get("link_url") or item.get("ad_library_url", "#"),
            "body": {"text": body_text or ""},
            "images": images,
            "videos": videos,
            "cards": cards 
        }
    }

def get_demographics(ad):
    # Helper um Demographics sicher zu holen
    breakdown = get_nested_value(ad, ['aaa_info', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['transparency_by_location', 'eu_transparency', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['eu_data', 'age_country_gender_reach_breakdown'])
    return breakdown or []

async def search_meta_ads(query: str, country: str = "US", start_date_min: str = None, start_date_max: str = None, active_status: str = "active", limit: int = 20):
    target_country = country.upper() if country and country != "ALL" else "US"
    
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status={active_status}" 
        f"&ad_type=all"
        f"&country={target_country}"
        f"&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"
        f"&media_type=all"
    )

    if start_date_min: search_url += f"&start_date[min]={start_date_min}"
    if start_date_max: search_url += f"&start_date[max]={start_date_max}"

    # FIX: Hier verwenden wir jetzt das dynamische 'limit' statt fester 100
    POOL_SIZE = limit
    
    run_input = {
        "urls": [{"url": search_url}],
        "count": POOL_SIZE,
        "maxItems": POOL_SIZE,
        "pageTimeoutSecs": 60,
        "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    logger.info(f"DEBUG: Start Scrape for '{query}' | Pool={POOL_SIZE} | Status={active_status}")

    try:
        loop = asyncio.get_event_loop()
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512,
            timeout_secs=480 # Etwas mehr Zeit für größere Limits
        ))
        
        if not run:
            logger.error("❌ Apify call returned NO run object.")
            return []

        logger.info(f"Run Status: {run.get('status')} | Run ID: {run.get('id')}")

        dataset_id = run.get("defaultDatasetId")
        if dataset_id:
            logger.info(f"✅ Fetching items from Dataset: {dataset_id}")
            dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True).items)
            
            logger.info(f"📥 Downloaded {len(dataset_items)} raw items.")
            
            results_pool = []
            seen_ids = set()

            for i, item in enumerate(dataset_items):
                try:
                    norm = normalize_meta_ad(item)
                    if norm and isinstance(norm, dict) and norm.get('id'): 
                        if norm['id'] in seen_ids: continue
                        seen_ids.add(norm['id'])
                        results_pool.append(norm)
                    else:
                        if i < 5: logger.warning(f"Skipped item {i}: Normalization failed or no ID.")
                except Exception as e:
                    logger.error(f"❌ Error processing item {i}: {str(e)}")
                    continue
            
            logger.info(f"📊 Validated Ads for Scoring: {len(results_pool)}")
            
            if not results_pool: 
                logger.warning("⚠️ No valid ads found after normalization.")
                return []

            # --- SCORING LOGIK (Unverändert) ---
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
                adjusted_val = velocity * norm_factor * 5 
                ad['efficiency_score'] = calculate_log_score(adjusted_val)
                ad['viral_factor'] = round(ad['viral_ratio'] / global_avg, 1)

            results_pool.sort(key=lambda x: (x.get('efficiency_score') or 0), reverse=True)
            logger.info(f"✅ Success. Returning {len(results_pool)} scored ads.")
            return results_pool
            
    except Exception as e:
        logger.error(f"❌ CRITICAL BACKEND ERROR: {str(e)}")
        return []
    
    return []