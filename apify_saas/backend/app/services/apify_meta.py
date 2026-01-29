from apify_client import ApifyClient
from app.core.config import settings
import datetime
import asyncio
import math
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Client initialisieren (Settings müssen geladen sein)
client = ApifyClient(settings.APIFY_TOKEN)

# --- HELPER FUNCTIONS ---

def get_nested_value(ad, path_list):
    """Sicherer Zugriff auf verschachtelte Dictionaries."""
    current = ad
    for key in path_list:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return current

def get_page_size(item):
    """Ermittelt die Größe der Seite (Likes/Follower)."""
    if not item: return 0
    likes = item.get("likes", 0) or item.get("page_like_count", 0)
    advertiser = item.get("advertiser", {})
    page_info = advertiser.get("ad_library_page_info", {}).get("page_info", {})
    
    if not likes: likes = page_info.get("likes", 0) or 0
    ig_followers = page_info.get("ig_followers", 0) or 0
    
    if not likes: 
        likes = item.get("snapshot", {}).get("page_like_count", 0) or 0

    return (int(likes or 0) + int(ig_followers or 0))

def get_advertiser_info(item):
    """Extrahiert Infos über den Werbetreibenden."""
    advertiser = item.get("advertiser", {})
    page_info = advertiser.get("ad_library_page_info", {}).get("page_info", {})
    page_data = advertiser.get("page", {})
    about = page_data.get("about", {})
    
    return {
        "facebook_handle": page_info.get("page_alias"),
        "facebook_followers": page_info.get("likes"),
        "instagram_handle": page_info.get("ig_username"),
        "instagram_followers": page_info.get("ig_followers"),
        "about_text": about.get("text"), # FIX: 'about' Variable ist jetzt korrekt definiert
        "category": page_info.get("page_category")
    }

def get_days_active(start_timestamp):
    """Berechnet wie viele Tage die Ad aktiv ist."""
    if not start_timestamp: return 1.0
    try:
        start_date = None
        if isinstance(start_timestamp, str):
            if len(start_timestamp) == 10: 
                start_date = datetime.datetime.strptime(start_timestamp, "%Y-%m-%d")
            else: 
                # ISO Format fixen falls Z am Ende
                start_date = datetime.datetime.fromisoformat(start_timestamp.replace('Z', '+00:00'))
        elif isinstance(start_timestamp, (int, float)):
            start_date = datetime.datetime.fromtimestamp(int(start_timestamp))
        
        if not start_date:
            return 1.0
            
        # Zeitzone entfernen für simple Berechnung
        start_date = start_date.replace(tzinfo=None)
        now = datetime.datetime.now()
        
        diff = (now - start_date).total_seconds()
        return max(0.5, diff / 86400)
    except Exception:
        return 1.0

def get_time_cohort(days):
    if days <= 3: return "LAUNCH"      
    if days <= 14: return "TRENDING"   
    if days <= 30: return "ESTABLISHED"
    return "EVERGREEN"                 

def get_ad_cluster(ad):
    """Klassifiziert Ads grob nach Typ."""
    cats = str(ad.get("page_categories", [])).lower()
    cta = str(ad.get("snapshot", {}).get("cta_text", "")).lower()
    
    if any(k in cats for k in ['medical', 'doctor', 'b2b', 'agency']) or cta in ['book now', 'contact us']: 
        return 'B' # Business / Service
    if any(k in cats for k in ['media', 'news', 'creator', 'fun']) or cta in ['watch more']: 
        return 'C' # Content / Media
    return 'A' # E-Commerce / General

def calculate_log_score(value):
    if value <= 0: return 0
    return round(min(18 * math.log2(1 + value), 100), 1)

def get_demographics(ad):
    """Sucht Demografie-Daten an verschiedenen Orten im JSON."""
    breakdown = get_nested_value(ad, ['aaa_info', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['transparency_by_location', 'eu_transparency', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['eu_data', 'age_country_gender_reach_breakdown'])
    return breakdown or []

def normalize_meta_ad(item):
    """Wandelt Rohdaten von Apify in unser Standardformat um."""
    if not item: return None
    raw_snapshot = item.get("snapshot") or {}
    raw_id = item.get("ad_archive_id") or item.get("ad_id")
    
    # Ohne ID ist die Ad nutzlos
    if not raw_id or str(raw_id) == "nan": return None 
    safe_id = str(raw_id)

    # Reach ermitteln (Priorität: EU Transparency -> AAA Info -> Estimate)
    reach = 0
    reach = get_nested_value(item, ['eu_transparency', 'eu_total_reach']) or \
            get_nested_value(item, ['aaa_info', 'eu_total_reach']) or \
            get_nested_value(item, ['transparency_by_location', 'eu_transparency', 'eu_total_reach'])
    
    if not reach:
        re = item.get('reach_estimate')
        if isinstance(re, dict): reach = re.get('reach_upper_bound')
        elif isinstance(re, (int, float)): reach = re
    reach = int(reach) if reach else 0

    page_size = get_page_size(item)
    viral_ratio = reach / max(page_size, 1000)
    days_active = get_days_active(item.get("start_date"))
    
    images = raw_snapshot.get("images") or []
    videos = raw_snapshot.get("videos") or []
    cards = raw_snapshot.get("cards") or []
    
    # Body Text finden
    body_text = raw_snapshot.get("body", {}).get("text")
    if not body_text and cards and isinstance(cards[0], dict):
        body_text = cards[0].get("body")

    payer_beneficiary = get_nested_value(item, ['aaa_info', 'payer_beneficiary_data'])
    beneficiary_payer = None
    if payer_beneficiary and isinstance(payer_beneficiary, list) and len(payer_beneficiary) > 0:
        beneficiary_payer = {
            "payer": payer_beneficiary[0].get("payer"),
            "beneficiary": payer_beneficiary[0].get("beneficiary")
        }

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
        "viral_velocity": viral_ratio / days_active,
        "efficiency_score": 0, # Wird später berechnet
        "viral_factor": 0,     # Wird später berechnet
        "demographics": get_demographics(item), # Nutzung der Helper-Funktion
        "target_locations": get_nested_value(item, ['aaa_info', 'location_audience']) or [],
        "advertiser_info": get_advertiser_info(item),
        "beneficiary_payer": beneficiary_payer,
        "page_categories": item.get("categories", []),
        "snapshot": {
            "cta_text": raw_snapshot.get("cta_text", "Learn More"),
            "link_url": raw_snapshot.get("link_url") or item.get("ad_library_url", "#"),
            "body": {"text": body_text or ""},
            "images": images, 
            "videos": videos, 
            "cards": cards 
        }
    }

# --- MAIN SERVICE FUNCTION ---

async def search_meta_ads(query: str, limit: int, country: str = "US", start_date_min: str = None, start_date_max: str = None, active_status: str = "active"):
    target_country = country.upper() if country and country != "ALL" else "US"
    
    # URL Konstruktion - Matches User Logs
    search_url = f"https://www.facebook.com/ads/library/?active_status={active_status}&ad_type=all&country={target_country}&q={query}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&media_type=all"
    if start_date_min: search_url += f"&start_date[min]={start_date_min}"
    if start_date_max: search_url += f"&start_date[max]={start_date_max}"

    run_input = {
            "urls": [{"url": search_url}],
            "count": limit,
            "maxItems": limit,
            "pageTimeoutSecs": 60,
            "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
            "scrapeAdDetails": True, 
            "countryCode": target_country,
            
            # --- NEUE OPTIMIERUNGEN ---
            "downloadMedia": False,      # 1. Keine Bilder/Videos speichern (spart Zeit & Speicher)
            "scrapeLandingPage": False,  # 2. Zielwebseite nicht besuchen (enormer Speed-Boost)
            "takeScreenshots": False     # Zusätzlich: Kein Rendering der Ad-Vorschau
        }

        logger.info(f"DEBUG: Start Scrape for '{query}' | Limit={limit}")

    try:
        loop = asyncio.get_event_loop()
        
        # 1. Actor Aufruf (Blocking -> Async via Executor)
        # Dies verhindert, dass der Server einfriert (Endlosschleife/Timeout)
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512, # Etwas mehr RAM für Stabilität
            timeout_secs=900
        ))
        
        if not run: 
            logger.warning("Apify Actor returned None")
            return []
            
        dataset_id = run.get("defaultDatasetId")
        if not dataset_id: 
            logger.warning("No Dataset ID returned")
            return []

        # 2. Daten abholen (Ebenfalls Blocking -> Async via Executor)
        # WICHTIG: Auch dataset().list_items() ist ein Netzwerkaufruf und muss asynchron behandelt werden!
        dataset_items_page = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True))
        dataset_items = dataset_items_page.items
        
        # 3. Normalisierung und Filterung
        results_pool = []
        seen_ids = set()
        for i, item in enumerate(dataset_items):
            try:
                norm = normalize_meta_ad(item)
                if norm and norm.get('id') and norm['id'] not in seen_ids:
                    seen_ids.add(norm['id'])
                    results_pool.append(norm)
            except Exception as e:
                # Einzelne fehlerhafte Ads überspringen, nicht abbrechen
                continue
        
        if not results_pool: 
            return []

        # 4. Scoring Algorithmus (Viral Score Berechnung)
        cohort_buckets = {}
        for ad in results_pool:
            key = f"{get_ad_cluster(ad)}_{get_time_cohort(ad['days_active'])}"
            ad['_bucket'] = key
            cohort_buckets.setdefault(key, []).append(ad['viral_velocity'])

        bucket_avgs = {k: sum(v)/len(v) for k, v in cohort_buckets.items()}
        
        # Vermeidung von Division durch Null
        total_viral_ratio = sum(ad['viral_ratio'] for ad in results_pool)
        global_avg = max(0.1, total_viral_ratio / len(results_pool))

        for ad in results_pool:
            bucket = ad['_bucket']
            norm_factor = 1.0
            
            # Dynamische Normalisierung basierend auf Cohort-Daten
            if len(cohort_buckets.get(bucket, [])) >= 3:
                norm_factor = 2.0 / max(bucket_avgs.get(bucket, 0.1), 0.05)
            else:
                # Fallback Faktoren
                norm_factor = 3.0 if bucket.startswith('B') else (0.5 if bucket.startswith('C') else 1.0)
            
            ad['efficiency_score'] = calculate_log_score(ad['viral_velocity'] * min(norm_factor, 10.0) * 5)
            ad['viral_factor'] = round(ad['viral_ratio'] / global_avg, 1)
            
            # Temporären Key entfernen
            ad.pop('_bucket', None)

        # Sortieren nach Score
        results_pool.sort(key=lambda x: (x.get('efficiency_score') or 0), reverse=True)
        
        return results_pool
            
    except Exception as e:
        logger.error(f"❌ CRITICAL BACKEND ERROR in apify_meta: {str(e)}")
        # Leere Liste zurückgeben statt Server-Crash
        return []