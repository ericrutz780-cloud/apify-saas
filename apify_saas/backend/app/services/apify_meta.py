from apify_client import ApifyClient
from app.core.config import settings
import datetime
import asyncio

# Client initialisieren
client = ApifyClient(settings.APIFY_TOKEN)

def get_nested_value(ad, path_list):
    """Hilfsfunktion für tiefe JSON-Pfade."""
    current = ad
    for key in path_list:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return None
    return current

def normalize_meta_ad(item):
    """
    Normalisiert Daten für Frontend & Supabase.
    Inklusive robuster Reichweiten- und Demografie-Extraktion.
    """
    if not item: return None
    if "error" in item or "errorMessage" in item: return None

    raw_snapshot = item.get("snapshot") or {}
    
    # ID sicherstellen
    raw_id = item.get("ad_archive_id") or item.get("ad_id")
    if not raw_id or str(raw_id) == "nan": return None 
    safe_id = str(raw_id)

    # Medien
    images = raw_snapshot.get("images") or []
    videos = raw_snapshot.get("videos") or []
    cards = raw_snapshot.get("cards") or []
    
    # Karussell-Fix
    if not images and not videos and cards:
        first_card = cards[0]
        if isinstance(first_card, dict):
            img_url = first_card.get("resized_image_url") or first_card.get("original_image_url")
            if img_url: images.append({"resized_image_url": img_url})

    # Text sicher holen
    body_text = raw_snapshot.get("body", {}).get("text")
    if not body_text and cards and isinstance(cards[0], dict):
        body_text = cards[0].get("body")

    # --- REICHWEITEN LOGIK (PROTOTYP INTEGRATION) ---
    reach = 0
    # 1. EU Transparency (Root)
    reach = get_nested_value(item, ['eu_transparency', 'eu_total_reach'])
    # 2. AAA Info
    if not reach: reach = get_nested_value(item, ['aaa_info', 'eu_total_reach'])
    # 3. Transparency by Location
    if not reach: reach = get_nested_value(item, ['transparency_by_location', 'eu_transparency', 'eu_total_reach'])
    # 4. Standard Estimate
    if not reach:
        reach_est = item.get('reach_estimate')
        if isinstance(reach_est, dict):
            reach = reach_est.get('reach_upper_bound')
        elif isinstance(reach_est, (int, float)):
            reach = reach_est
    # 5. Impressions
    if not reach:
        reach = get_nested_value(item, ['impressions_with_index', 'impressions_index'])
        if reach == -1: reach = 0

    reach = int(reach) if reach else 0

    # --- DEMOGRAFIE & GEOGRAFIE ---
    # Wir sammeln alle relevanten Rohdaten für das Frontend/Supabase
    # Damit können wir später Charts bauen
    demographics_raw = \
        get_nested_value(item, ['aaa_info', 'age_country_gender_reach_breakdown']) or \
        get_nested_value(item, ['transparency_by_location', 'eu_transparency', 'age_country_gender_reach_breakdown']) or \
        get_nested_value(item, ['eu_data', 'age_country_gender_reach_breakdown']) or \
        []

    target_locations = \
        get_nested_value(item, ['aaa_info', 'location_audience']) or \
        get_nested_value(item, ['transparency_by_location', 'eu_transparency', 'location_audience']) or \
        item.get('targeted_or_reached_countries') or []

    return {
        "id": safe_id,
        "publisher_platform": item.get("publisher_platform", ["facebook"]),
        "start_date": item.get("start_date", ""),
        "page_name": item.get("page_name", "Unknown Page"),
        "page_profile_uri": item.get("page_profile_uri", "#"),
        "ad_library_url": item.get("ad_library_url", "#"),
        "likes": item.get("likes", 0) or item.get("page_like_count", 0),
        
        # WICHTIG: Die extrahierten "Winning" Daten
        "reach_estimate": reach, 
        "impressions": reach,
        "spend": item.get("spend", 0),
        
        # Komplexe Daten für Supabase (als JSON speichern)
        "demographics": demographics_raw,
        "target_locations": target_locations,
        
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
    Winning Product Search:
    - Filter: > 30 Tage aktiv
    - Sortierung: Nach echter Reichweite
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

    scrape_limit = limit * 5 # Buffer für Sortierung
    if scrape_limit > 100: scrape_limit = 100 

    run_input = {
        "urls": [{"url": search_url}],
        "count": scrape_limit,
        "maxItems": scrape_limit,
        "pageTimeoutSecs": 60,
        "proxy": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]},
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    print(f"DEBUG: Scrape Winning Products (< {cutoff_date}) für '{query}'")

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
            print(f"✅ Scrape beendet. Lade Daten...")
            dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True).items)
            
            normalized_results = []
            seen_ids = set()

            for item in dataset_items:
                try:
                    norm = normalize_meta_ad(item)
                    if norm and isinstance(norm, dict) and norm.get('id'): 
                        if norm['id'] in seen_ids: continue
                        seen_ids.add(norm['id'])
                        normalized_results.append(norm)
                except Exception:
                    continue
            
            # Sortierung nach der extrahierten Reichweite
            normalized_results.sort(
                key=lambda x: (x.get('reach_estimate') or 0), 
                reverse=True
            )

            return normalized_results[:limit]
            
    except Exception as e:
        print(f"❌ Apify Error: {str(e)}")
        return []
    
    return []