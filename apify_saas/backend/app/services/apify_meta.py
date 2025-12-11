from apify_client import ApifyClient
from app.core.config import settings
import datetime
import asyncio
import math 

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

def get_demographics(ad):
    breakdown = get_nested_value(ad, ['aaa_info', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['transparency_by_location', 'eu_transparency', 'age_country_gender_reach_breakdown'])
    if not breakdown: breakdown = get_nested_value(ad, ['eu_data', 'age_country_gender_reach_breakdown'])
    return breakdown or []

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

def get_ad_cluster(ad):
    """
    ROBUSTE Cluster-Zuordnung.
    A: Standard / E-Commerce (Mode, Gadgets) -> Normal
    B: Service / High Intent (Arzt, Software, Job) -> Bonus
    C: Viral / Entertainment (Blogs, News) -> Malus
    """
    # 1. Kategorien prüfen
    cats = ad.get("page_categories", [])
    if not cats: cats = []
    cats_str = str(cats).lower()
    
    # 2. CTA prüfen
    snapshot = ad.get("snapshot") or {}
    cta = snapshot.get("cta_text")
    if not cta: cta = ""
    cta = str(cta).lower()
    
    # --- CLUSTER B (Service / Jobs / B2B) ---
    service_keywords = [
        'medical', 'doctor', 'software', 'real estate', 'consulting', 
        'education', 'lawyer', 'dentist', 'service', 'health/beauty',
        'employment', 'job', 'karriere', 'b2b', 'agency'
    ]
    # Wenn CTA "Book now" ist ODER Keywords passen -> Cluster B
    if any(k in cats_str for k in service_keywords) or cta in ['book now', 'contact us', 'apply now']:
        return 'B'
        
    # --- CLUSTER C (Viral / Entertainment) ---
    viral_keywords = [
        'media', 'news', 'blog', 'creator', 'comedian', 'gamer', 
        'just for fun', 'entertainment', 'meme'
    ]
    if any(k in cats_str for k in viral_keywords) or cta in ['watch more', 'like page']:
        return 'C'
        
    # --- CLUSTER A (Default: E-Commerce) ---
    return 'A'

def calculate_log_score(ratio):
    """
    Logarithmische Skalierung auf 0-100.
    Formel: 15 * log2(1 + Ratio)
    """
    if ratio <= 0: return 0
    score = 15 * math.log2(1 + ratio)
    return round(min(score, 100), 1)

def normalize_meta_ad(item):
    if not item: return None
    if "error" in item or "errorMessage" in item: return None

    raw_snapshot = item.get("snapshot") or {}
    raw_id = item.get("ad_archive_id") or item.get("ad_id")
    if not raw_id or str(raw_id) == "nan": return None 
    safe_id = str(raw_id)

    images = raw_snapshot.get("images") or []
    videos = raw_snapshot.get("videos") or []
    cards = raw_snapshot.get("cards") or []
    if not images and not videos and cards:
        first_card = cards[0]
        if isinstance(first_card, dict):
            img_url = first_card.get("resized_image_url") or first_card.get("original_image_url")
            if img_url: images.append({"resized_image_url": img_url})

    body_text = raw_snapshot.get("body", {}).get("text")
    if not body_text and cards and isinstance(cards[0], dict):
        body_text = cards[0].get("body")

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
    
    reach = int(reach) if reach else 0

    # --- BASIS DATEN ---
    page_size = get_page_size(item)
    safe_audience = max(page_size, 1000) # Floor von 1000
    viral_ratio = reach / safe_audience
    
    # Meta Infos
    demographics_raw = get_demographics(item)
    target_locations = get_nested_value(item, ['aaa_info', 'location_audience']) or []
    advertiser_info = get_advertiser_info(item)
    
    # Kategorien sauber extrahieren (Wichtig für Cluster!)
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
        "page_profile_uri": item.get("page_profile_uri", "#"),
        "ad_library_url": item.get("ad_library_url", "#"),
        "likes": item.get("likes", 0) or item.get("page_like_count", 0),
        
        "reach_estimate": reach, 
        "impressions": reach,
        "spend": item.get("spend", 0),
        "page_size": page_size,
        
        # Rohdaten für den Algorithmus (werden unten final berechnet)
        "viral_ratio": viral_ratio, 
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
    HYBRIDER VIRAL SEARCH ALGORITHMUS:
    1. Holt 100 Ads (Pool).
    2. Weist Cluster zu (A/B/C).
    3. Berechnet dynamische Faktoren ("Boost") basierend auf dem Wettbewerb.
    """
    target_country = country.upper() if country and country != "ALL" else "US"
    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"
        f"&start_date[max]={cutoff_date}" 
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

    print(f"DEBUG: Starte Hybride Viral Search (Pool={POOL_SIZE}) für '{query}'...")

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
            print(f"✅ Scrape beendet. Analysiere Daten...")
            dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True).items)
            
            results_pool = []
            seen_ids = set()

            # 1. Normalisieren & Sammeln
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

            # --- HYBRIDER ALGORITHMUS START ---
            
            # 2. Clustern (Gruppieren für Statistik)
            clusters = {'A': [], 'B': [], 'C': []}
            for ad in results_pool:
                cluster = get_ad_cluster(ad)
                ad['_cluster'] = cluster # Temporär speichern
                clusters[cluster].append(ad['viral_ratio'])

            # 3. Cluster-Durchschnitte berechnen (Benchmark)
            cluster_avgs = {}
            for c, ratios in clusters.items():
                if ratios:
                    cluster_avgs[c] = sum(ratios) / len(ratios)
                else:
                    cluster_avgs[c] = 0

            # 4. Globaler Durchschnitt für das Badge
            global_total = sum(ad['viral_ratio'] for ad in results_pool)
            global_avg = global_total / len(results_pool) if len(results_pool) > 0 else 1.0
            if global_avg < 0.1: global_avg = 0.1

            # 5. Finales Scoring für jede Ad
            for ad in results_pool:
                ratio = ad['viral_ratio']
                cluster = ad['_cluster']
                count_in_cluster = len(clusters[cluster])
                
                # DIE LOGIK: Datengetrieben oder Heuristisch?
                norm_factor = 1.0
                
                if count_in_cluster >= 5:
                    # Genug Daten -> Wir nutzen den echten Cluster-Durchschnitt (Smart Boost)
                    # Wir normieren alles auf eine "Ziel-Ratio" von 3.0
                    c_avg = max(cluster_avgs[cluster], 0.1)
                    norm_factor = 3.0 / c_avg 
                else:
                    # Zu wenig Daten -> Fallback auf Experten-Faktoren
                    if cluster == 'B': norm_factor = 1.5   # Service Boost
                    elif cluster == 'C': norm_factor = 0.6 # Viral Bremse
                    else: norm_factor = 1.0                # Standard
                
                # Begrenzung des Faktors (Sicherheit)
                if norm_factor > 5.0: norm_factor = 5.0
                if norm_factor < 0.2: norm_factor = 0.2

                # Finalen Score berechnen
                adjusted_ratio = ratio * norm_factor
                ad['efficiency_score'] = calculate_log_score(adjusted_ratio)
                
                # Faktor für das Frontend-Badge (Vergleich zum Pool)
                ad['viral_factor'] = round(ratio / global_avg, 1)

            # --- HYBRIDER ALGORITHMUS ENDE ---

            # 6. Sortieren nach dem neuen Score
            results_pool.sort(
                key=lambda x: (x.get('efficiency_score') or 0), 
                reverse=True
            )

            print(f"📊 Analyse fertig. Top Score: {results_pool[0]['efficiency_score']}. Sende {len(results_pool)} Ads.")
            return results_pool
            
    except Exception as e:
        print(f"❌ Apify Error: {str(e)}")
        return []
    
    return []