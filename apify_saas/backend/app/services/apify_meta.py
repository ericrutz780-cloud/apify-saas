from apify_client import ApifyClient
from app.core.config import settings
import datetime
import asyncio
import math 

client = ApifyClient(settings.APIFY_TOKEN)

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

def calculate_viral_score(ratio):
    """
    Logarithmischer Score (0-100) basierend auf der Ratio.
    """
    # log2(1 + ratio) * 15 -> Skaliert schön auf 0-100
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

    # --- VIRALITÄTS METRIKEN ---
    page_size = get_page_size(item)
    # Floor: 1000 Follower Minimum, um Rauschen bei Mini-Seiten zu vermeiden
    safe_audience = max(page_size, 1000)
    
    # Die "rohe" Leistung (Wie oft wurde die Ad im Verhältnis zur Base gesehen?)
    viral_ratio = reach / safe_audience
    
    # Der geglättete Score (0-100) für das Ranking
    efficiency_score = calculate_viral_score(viral_ratio)

    # Meta
    demographics_raw = get_demographics(item)
    target_locations = get_nested_value(item, ['aaa_info', 'location_audience']) or []
    advertiser_info = get_advertiser_info(item)

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
        
        # WICHTIG: Score UND Ratio weitergeben
        "efficiency_score": efficiency_score, 
        "viral_ratio": viral_ratio, # Brauchen wir für die Durchschnittsberechnung
        
        "demographics": demographics_raw,
        "target_locations": target_locations,
        "advertiser_info": advertiser_info,
        
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
    target_country = country.upper() if country and country != "ALL" else "US"
    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"
        f"&start_date[max]={cutoff_date}" 
        f"&media_type=all"
    )

    # Wir holen immer 100 Ads für den statistischen Pool
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

    print(f"DEBUG: Starte 'Viral Search' (Pool={POOL_SIZE}) für '{query}'...")

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
            print(f"✅ Scrape beendet. Verarbeite Daten...")
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
            
            # 2. Pool-Statistiken berechnen (Der Benchmark)
            if results_pool:
                total_ratio = sum(ad['viral_ratio'] for ad in results_pool)
                # Schutz vor Division durch 0, falls alle 0 sind
                avg_pool_ratio = total_ratio / len(results_pool) if len(results_pool) > 0 else 1.0
                if avg_pool_ratio < 0.1: avg_pool_ratio = 0.1 # Minimum Benchmark

                print(f"📊 Pool Stats: {len(results_pool)} Ads. Avg Ratio: {avg_pool_ratio:.2f}")

                # 3. Faktor für jede Ad berechnen (Ad Ratio / Pool Average)
                for ad in results_pool:
                    ad_ratio = ad.get('viral_ratio', 0)
                    factor = ad_ratio / avg_pool_ratio
                    ad['viral_factor'] = round(factor, 1) # z.B. 12.5x

            # 4. Sortieren nach dem absoluten Score (Qualität)
            results_pool.sort(
                key=lambda x: (x.get('efficiency_score') or 0), 
                reverse=True
            )

            # Wir geben ALLES zurück, das Frontend kümmert sich um die Anzeige
            return results_pool
            
    except Exception as e:
        print(f"❌ Apify Error: {str(e)}")
        return []
    
    return []