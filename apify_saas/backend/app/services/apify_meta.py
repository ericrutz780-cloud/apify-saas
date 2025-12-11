from apify_client import ApifyClient
from app.core.config import settings
import datetime
import asyncio
import math
import time

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
        # Falls Timestamp als String oder Int kommt
        if isinstance(start_timestamp, str):
            try:
                # Versuch ISO Format (z.B. '2025-11-09')
                if len(start_timestamp) == 10:
                    start_date = datetime.datetime.strptime(start_timestamp, "%Y-%m-%d")
                else:
                    start_date = datetime.datetime.fromisoformat(start_timestamp.replace('Z', '+00:00'))
            except:
                return 1.0
        else:
            start_date = datetime.datetime.fromtimestamp(int(start_timestamp))
            
        now = datetime.datetime.now()
        delta = now - start_date
        
        # Wir nutzen Float für Präzision bei ganz frischen Ads (z.B. 0.5 Tage = 12h)
        # Minimum 0.5, damit Velocity bei ganz neuen Ads nicht ins Unendliche schießt
        days = max(0.5, delta.total_seconds() / 86400)
        return days
    except:
        return 1.0

def get_time_cohort(days):
    """Ordnet die Ad einer Zeit-Phase zu."""
    if days <= 3: return "LAUNCH"      # 0-3 Tage (Explosive Starts)
    if days <= 14: return "TRENDING"   # 4-14 Tage (Skalierung)
    if days <= 30: return "ESTABLISHED"# 15-30 Tage (Stabile Winner)
    return "EVERGREEN"                 # 30+ Tage (Dauerbrenner)

def get_ad_cluster(ad):
    """
    Kategorie-Cluster:
    A: Standard / E-Commerce (Mode, Gadgets)
    B: Service / High Intent (Arzt, Software, Job) -> Bonus
    C: Viral / Entertainment (Blogs, News) -> Malus
    """
    cats = ad.get("page_categories", [])
    if not cats: cats = []
    cats_str = str(cats).lower()
    
    snapshot = ad.get("snapshot") or {}
    cta = snapshot.get("cta_text")
    if not cta: cta = ""
    cta = str(cta).lower()
    
    # CLUSTER B (Service / B2B)
    service_keywords = [
        'medical', 'doctor', 'software', 'real estate', 'consulting', 
        'education', 'lawyer', 'dentist', 'service', 'health/beauty',
        'employment', 'job', 'karriere', 'b2b', 'agency', 'business'
    ]
    if any(k in cats_str for k in service_keywords) or cta in ['book now', 'contact us', 'apply now']:
        return 'B'
        
    # CLUSTER C (Viral / Entertainment)
    viral_keywords = [
        'media', 'news', 'blog', 'creator', 'comedian', 'gamer', 
        'just for fun', 'entertainment', 'meme'
    ]
    if any(k in cats_str for k in viral_keywords) or cta in ['watch more', 'like page']:
        return 'C'
        
    # CLUSTER A (Default E-Commerce)
    return 'A'

def calculate_log_score(value):
    """Logarithmische Skalierung auf 0-100."""
    if value <= 0: return 0
    # Skalierung angepasst für Velocity-Werte
    score = 18 * math.log2(1 + value)
    return round(min(score, 100), 1)

def normalize_meta_ad(item):
    if not item: return None
    if "error" in item or "errorMessage" in item: return None

    raw_snapshot = item.get("snapshot") or {}
    raw_id = item.get("ad_archive_id") or item.get("ad_id")
    if not raw_id or str(raw_id) == "nan": return None 
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
        # Fallback für Impressions Index wenn gar nichts da ist
        reach = get_nested_value(item, ['impressions_with_index', 'impressions_index'])
        if reach == -1: reach = 0
        
    reach = int(reach) if reach else 0

    # --- BASIS METRIKEN ---
    page_size = get_page_size(item)
    safe_audience = max(page_size, 1000) 
    viral_ratio = reach / safe_audience
    
    # --- ZEIT & GESCHWINDIGKEIT (Velocity) ---
    start_date_ts = item.get("start_date") 
    days_active = get_days_active(start_date_ts)
    viral_velocity = viral_ratio / days_active # Ratio pro Tag = Geschwindigkeit
    
    # Meta Infos
    advertiser_info = get_advertiser_info(item)
    demographics_raw = get_demographics(item)
    target_locations = get_nested_value(item, ['aaa_info', 'location_audience']) or []
    
    page_cats = item.get("categories", [])
    if raw_snapshot.get("page_categories"):
        cats = raw_snapshot.get("page_categories")
        if isinstance(cats, dict): page_cats = list(cats.values())
        elif isinstance(cats, list): page_cats = cats

    # Bilder/Videos extrahieren
    images = raw_snapshot.get("images") or []
    videos = raw_snapshot.get("videos") or []
    cards = raw_snapshot.get("cards") or []
    body_text = raw_snapshot.get("body", {}).get("text")
    if not body_text and cards and isinstance(cards[0], dict):
        body_text = cards[0].get("body")

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
        
        # --- NEUE METRIKEN FÜR DEN ALGORITHMUS ---
        "viral_ratio": viral_ratio, 
        "days_active": days_active,
        "viral_velocity": viral_velocity,
        
        # Platzhalter (werden unten final berechnet)
        "efficiency_score": 0, 
        "viral_factor": 0,     
        
        "demographics": demographics_raw,
        "target_locations": target_locations,
        "advertiser_info": advertiser_info,
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

async def search_meta_ads(query: str, country: str = "US", limit: int = 20):
    """
    HYBRIDER VIRAL SEARCH v2 (Velocity Edition)
    1. Holt ALLE aktiven Ads (kein Datums-Filter).
    2. Bildet Kohorten (Launch, Trending, Evergreen).
    3. Normalisiert Velocity innerhalb der Kohorten.
    """
    target_country = country.upper() if country and country != "ALL" else "US"
    
    # WICHTIG: Kein start_date[max], damit wir auch Ads von HEUTE bekommen!
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"
        f"&media_type=all"
    )

    POOL_SIZE = 100

    run_input = {
        "urls": [{"url": search_url}],
        "count": POOL_SIZE,
        "maxItems": POOL_SIZE,
        "pageTimeoutSecs": 60,
        "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    print(f"DEBUG: Starte Velocity Search (Pool={POOL_SIZE}) für '{query}'...")

    try:
        loop = asyncio.get_event_loop()
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512,
            timeout_secs=240
        ))
        
        if not run: return []

        dataset_id = run.get("defaultDatasetId")
        if dataset_id:
            print(f"✅ Scrape beendet. Verarbeite Velocity-Daten...")
            dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True).items)
            
            results_pool = []
            seen_ids = set()

            # 1. Normalisieren
            for item in dataset_items:
                try:
                    norm = normalize_meta_ad(item)
                    if norm and isinstance(norm, dict) and norm.get('id'): 
                        if norm['id'] in seen_ids: continue
                        seen_ids.add(norm['id'])
                        results_pool.append(norm)
                except Exception:
                    continue
            
            if not results_pool: return []

            # --- INTELLIGENTES SCORING SYSTEM ---
            
            # A) Metadaten anreichern (Cluster & Kohorte)
            cohort_buckets = {} # z.B. "A_LAUNCH", "A_TRENDING"
            
            for ad in results_pool:
                cat_cluster = get_ad_cluster(ad)
                time_cohort = get_time_cohort(ad['days_active'])
                bucket_key = f"{cat_cluster}_{time_cohort}"
                
                ad['_bucket'] = bucket_key
                
                if bucket_key not in cohort_buckets:
                    cohort_buckets[bucket_key] = []
                cohort_buckets[bucket_key].append(ad['viral_velocity'])

            # B) Benchmarks berechnen (Durchschnitts-Velocity pro Bucket)
            bucket_avgs = {}
            for key, velocities in cohort_buckets.items():
                if velocities:
                    bucket_avgs[key] = sum(velocities) / len(velocities)
                else:
                    bucket_avgs[key] = 0.1 # Fallback

            # Globaler Durchschnitt für das Badge (wir nutzen Ratio für User-Verständlichkeit)
            global_ratio_total = sum(ad['viral_ratio'] for ad in results_pool)
            global_ratio_avg = global_ratio_total / len(results_pool) if len(results_pool) > 0 else 1.0
            if global_ratio_avg < 0.1: global_ratio_avg = 0.1

            # C) Finales Scoring für jede Ad
            for ad in results_pool:
                velocity = ad['viral_velocity']
                bucket = ad['_bucket']
                
                # Wir vergleichen die Ad mit ihrem Kohorten-Durchschnitt
                # "Wie viel schneller wächst diese Ad als andere in derselben Phase?"
                count_in_bucket = len(cohort_buckets[bucket])
                
                # Wenn genug Daten da sind, nutzen wir den echten Durchschnitt
                norm_factor = 1.0
                if count_in_bucket >= 3:
                    benchmark = max(bucket_avgs[bucket], 0.05)
                    # Ziel: Ein "guter" Wert (2x besser) soll auf ~3.0 Velocity normiert werden
                    norm_factor = 2.0 / benchmark 
                else:
                    # Fallback Heuristiken, falls Kohorte leer ist
                    cluster_char = bucket.split('_')[0]
                    if cluster_char == 'B': norm_factor = 3.0 # Service braucht Boost
                    elif cluster_char == 'C': norm_factor = 0.5 # Viral braucht Bremse
                    else: norm_factor = 1.0
                
                # Begrenzung für Sicherheit
                if norm_factor > 10.0: norm_factor = 10.0
                
                # Adjusted Velocity -> Score
                # Wir nehmen die Velocity mal Faktor. 
                # Eine Velocity von 1.0 (100% Reach in 1 Tag) ist extrem gut.
                # Wir skalieren das mit *5 für die Log-Formel.
                adjusted_val = velocity * norm_factor * 5 
                
                ad['efficiency_score'] = calculate_log_score(adjusted_val)
                
                # Das Badge zeigt weiterhin den absoluten Faktor (Ratio vs Global Avg)
                # Das versteht der User am besten ("10x viraler als der Rest")
                ad['viral_factor'] = round(ad['viral_ratio'] / global_ratio_avg, 1)

            # 6. Sortieren nach dem neuen Score
            results_pool.sort(
                key=lambda x: (x.get('efficiency_score') or 0), 
                reverse=True
            )

            print(f"📊 Velocity-Analyse fertig. Top Score: {results_pool[0]['efficiency_score']}. Sende {len(results_pool)} Ads.")
            return results_pool
            
    except Exception as e:
        print(f"❌ Apify Error: {str(e)}")
        return []
    
    return []