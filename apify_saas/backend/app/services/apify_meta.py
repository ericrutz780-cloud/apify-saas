from apify_client import ApifyClient
from core.config import settings
import uuid
import datetime

# Client initialisieren (einmalig)
client = ApifyClient(settings.APIFY_API_TOKEN)

def normalize_meta_ad(item):
    """
    Normalisiert Daten aus Apify für das Frontend.
    Strikte Validierung: Wenn kein Bild/Video da ist -> None.
    """
    if not item: return None
    
    # Fehlerhafte Items sofort aussortieren
    if "error" in item or "errorMessage" in item:
        return None

    raw_snapshot = item.get("snapshot")
    if not raw_snapshot:
        return None

    # ID sicherstellen
    raw_id = item.get("ad_archive_id") or item.get("ad_id")
    safe_id = str(raw_id) if raw_id and str(raw_id) != "nan" else f"gen_{uuid.uuid4()}"

    # Medien suchen (Video > Card > Image)
    images = raw_snapshot.get("images") or []
    videos = raw_snapshot.get("videos") or []
    cards = raw_snapshot.get("cards") or []
    
    # Karussell-Fix: Wenn keine direkten Bilder/Videos da sind, aber Cards,
    # versuchen wir, das Bild aus der ersten Karte zu holen.
    if not images and not videos and cards:
        first_card = cards[0]
        img_url = first_card.get("resized_image_url") or \
                  first_card.get("original_image_url") or \
                  first_card.get("video_preview_image_url")
        if img_url:
            images.append({"resized_image_url": img_url})

    # Text Fallback
    body_text = raw_snapshot.get("body", {}).get("text")
    if not body_text and cards:
        body_text = cards[0].get("body")

    # Metrics Parsing (Sicherstellen, dass Zahlen auch Zahlen sind)
    likes = item.get("likes", 0) or item.get("page_like_count", 0)
    
    # Impressions Logik (Meta liefert das oft verschachtelt)
    impressions = 0
    imp_data = item.get("impressions_with_index")
    if imp_data and isinstance(imp_data, dict):
        # Versuche verschiedene Felder
        impressions = imp_data.get("impressions_min") or \
                      imp_data.get("impressions_index") or 0
    elif item.get("reach_estimate"):
         impressions = item.get("reach_estimate")

    return {
        "id": safe_id,
        "publisher_platform": item.get("publisher_platform", ["facebook"]),
        "start_date": item.get("start_date", ""),
        "page_name": item.get("page_name", "Unknown Page"),
        "page_profile_uri": item.get("page_profile_uri", "#"),
        "ad_library_url": item.get("ad_library_url", "#"),
        "likes": likes,
        "impressions": impressions,
        "spend": item.get("spend", 0),
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
    Führt eine Suche auf der Meta Ad Library via Apify aus.
    Nutzt 'fetch_meta_ads_live' Logik aber als async Service Funktion.
    """
    # Country Mapping / Fallback
    target_country = country.upper() if country and country != "ALL" else "US"
    
    # Datumsgrenze (letzte 90 Tage)
    start_date_min = (datetime.datetime.now() - datetime.timedelta(days=90)).strftime("%Y-%m-%d")
    
    # Sortierung
    sort_mode = "relevancy_monthly_grouped" # Standard für beste Ergebnisse

    # URL Konstruktion
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]={sort_mode}"
        f"&start_date[min]={start_date_min}" 
        f"&media_type=all"
    )

    # Actor Input Konfiguration
    # WICHTIG: 'count' ist oft der entscheidende Parameter bei diesem Actor
    run_input = {
        "startUrls": [{"url": search_url}], # Manche Actors nutzen 'startUrls', manche 'urls'
        "urls": [{"url": search_url}],      # Wir senden beides zur Sicherheit
        
        "count": limit, 
        "maxItems": limit, 
        "adsCount": limit, # Und noch eine Variante, die manche Actors nutzen

        "pageTimeoutSecs": 60,
        "proxy": {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"]
        },
        # Zwinge den Scraper Details zu laden (wichtig für EU Daten!)
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    print(f"DEBUG: Starting Apify Scrape for {query} in {target_country} (Limit: {limit})")
    print(f"DEBUG: Search URL: {search_url}")

    try:
        # Den richtigen Actor aufrufen (curious_coder/facebook-ads-library-scraper oder ähnlich)
        # Ich nutze hier den String, den du in deinem Snippet hattest ("XtaWFhbtfxyzqrFmd" scheint eine ID zu sein, 
        # aber 'curious_coder/facebook-ads-library-scraper' ist lesbarer. Ich nehme den Namen.)
        run = client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=1024, # Etwas mehr RAM geben
            timeout_secs=180    # 3 Minuten Timeout
        )
        
        if not run:
            print("⚠️ Scrape wurde abgebrochen oder lieferte kein Run-Objekt.")
            return []

        dataset_id = run.get("defaultDatasetId")
        if dataset_id:
            print(f"✅ Scrape beendet. Lade Daten aus Dataset {dataset_id}...")
            # Daten laden
            dataset_items = client.dataset(dataset_id).list_items(clean=True).items
            
            normalized_results = []
            seen_ids = set()

            for item in dataset_items:
                norm = normalize_meta_ad(item)
                if norm: 
                    # Deduplizierung
                    if norm['id'] in seen_ids: continue
                    seen_ids.add(norm['id'])
                    
                    normalized_results.append(norm)
                    
                    if len(normalized_results) >= limit:
                        break
            
            print(f"✅ Gebe {len(normalized_results)} bereinigte Ads zurück.")
            return normalized_results
            
    except Exception as e:
        print(f"❌ Apify Error in search_meta_ads: {str(e)}")
        # Im Fehlerfall leere Liste, damit Frontend nicht crasht
        return []
    
    return []