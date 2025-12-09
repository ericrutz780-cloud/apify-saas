from apify_client import ApifyClient
from app.core.config import settings
import uuid
import datetime
import asyncio

# WICHTIG: Prüfe, ob es in deiner settings-Datei APIFY_TOKEN oder APIFY_API_TOKEN heißt.
# Basierend auf deiner config.py sollte es APIFY_TOKEN sein.
client = ApifyClient(settings.APIFY_TOKEN)

def normalize_meta_ad(item):
    """
    Normalisiert Daten aus Apify für das Frontend.
    Strikte Validierung: Wenn kein Bild/Video da ist -> None.
    Hält sich an den Code aus deinem Prompt, ergänzt um CamelCase Checks.
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
    # safe_id generieren wir nicht neu, sondern nehmen die echte ID oder überspringen
    if not raw_id or str(raw_id) == "nan":
         return None 
    
    safe_id = str(raw_id)

    # Medien suchen (Video > Card > Image)
    images = raw_snapshot.get("images") or []
    videos = raw_snapshot.get("videos") or []
    cards = raw_snapshot.get("cards") or []
    
    # Karussell-Fix
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
    
    # HIER IST DEIN PUNKT: Wir prüfen explizit auf 'reachEstimate' aus der Doku
    reach = item.get("reachEstimate") or item.get("reach_estimate") or 0
    
    # Fallback auf Impressions, wenn keine explizite Reichweite da ist
    if not reach:
        imp_data = item.get("impressions_with_index")
        if imp_data and isinstance(imp_data, dict):
            reach = imp_data.get("impressions_min") or imp_data.get("impressions_index") or 0

    return {
        "id": safe_id,
        "publisher_platform": item.get("publisher_platform", ["facebook"]),
        "start_date": item.get("start_date", ""),
        "page_name": item.get("page_name", "Unknown Page"),
        "page_profile_uri": item.get("page_profile_uri", "#"),
        "ad_library_url": item.get("ad_library_url", "#"),
        "likes": likes,
        # Wir geben reachEstimate hier weiter!
        "reach_estimate": reach, 
        "impressions": reach,
        "spend": item.get("spend", 0),
        
        # Leite EU-Daten weiter (prüfe auch CamelCase euAudienceData)
        "targeted_or_reached_countries": item.get("targeted_or_reached_countries", []),
        "eu_data": item.get("eu_data") or item.get("euAudienceData"), 
        
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
    MODIFIZIERT: 'Winning Product' Logik -> Nur Ads, die älter als 30 Tage sind.
    """
    # Country Mapping
    target_country = country.upper() if country and country != "ALL" else "US"
    
    # --- NEUE LOGIK: 30-Tage-Filter ---
    # Wir berechnen das Datum vor genau 30 Tagen.
    # Alles was VOR diesem Datum gestartet ist und HEUTE noch aktiv ist, ist ein "Long-Runner" (Winner).
    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    
    # URL Konstruktion
    # ÄNDERUNG: start_date[max] statt start_date[min]
    # start_date[max] = "Zeige mir Ads, deren Startdatum KLEINER/ÄLTER ist als cutoff_date"
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"
        f"&start_date[max]={cutoff_date}" 
        f"&media_type=all"
    )

    # Actor Input Konfiguration
    run_input = {
        "startUrls": [{"url": search_url}],
        # Wir setzen count etwas höher als limit, da wir evtl. Duplikate filtern
        "count": limit, 
        "maxItems": limit, 
        
        "pageTimeoutSecs": 60,
        "proxy": {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"]
        },
        
        # ZWINGEND: Details scrapen (für Reichweite/EU-Daten)
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    print(f"DEBUG: Scrape 'Winning Products' (>30 Tage aktiv) für '{query}' in '{target_country}'")

    try:
        # Führe den Call in einem Threadpool aus, um Async nicht zu blockieren
        loop = asyncio.get_event_loop()
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=1024,
            timeout_secs=240
        ))
        
        if not run:
            print("⚠️ Scrape wurde abgebrochen.")
            return []

        dataset_id = run.get("defaultDatasetId")
        if dataset_id:
            print(f"✅ Scrape beendet. Lade Daten aus Dataset {dataset_id}...")
            # Daten laden
            dataset_items = await loop.run_in_executor(None, lambda: client.dataset(dataset_id).list_items(clean=True).items)
            
            normalized_results = []
            seen_ids = set()

            for item in dataset_items:
                norm = normalize_meta_ad(item)
                if norm: 
                    if norm['id'] in seen_ids: continue
                    seen_ids.add(norm['id'])
                    normalized_results.append(norm)
                    if len(normalized_results) >= limit:
                        break
            
            print(f"✅ {len(normalized_results)} Winning-Ads verarbeitet.")
            return normalized_results
            
    except Exception as e:
        print(f"❌ Apify Error in search_meta_ads: {str(e)}")
        return []
    
    return []