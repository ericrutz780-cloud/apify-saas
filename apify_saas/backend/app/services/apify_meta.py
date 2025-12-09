from apify_client import ApifyClient
from app.core.config import settings
import datetime
import asyncio

# Client initialisieren
client = ApifyClient(settings.APIFY_TOKEN)

def normalize_meta_ad(item):
    """
    Normalisiert Daten aus Apify für das Frontend.
    UPDATE: Holt jetzt auch Reichweite aus 'eu_transparency' (wichtig für DE!).
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

    # Metrics Parsing
    likes = item.get("likes", 0) or item.get("page_like_count", 0)
    
    # --- REICHWEITEN LOGIK UPDATE ---
    # 1. Versuch: Standardfeld (oft leer bei DE Ads)
    reach = item.get("reachEstimate") or item.get("reach_estimate") or 0
    
    # 2. Versuch: EU Transparency Data (Das fehlte vorher!)
    # Hier stehen die echten Daten für Deutschland/EU
    if not reach:
        eu_data = item.get("eu_transparency") or item.get("eu_data") or item.get("euAudienceData")
        if eu_data and isinstance(eu_data, dict):
            reach = eu_data.get("eu_total_reach") or 0

    # 3. Versuch: Impressions Fallback (letzte Rettung)
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
        "reach_estimate": reach,  # Jetzt korrekt mit EU-Daten befüllt
        "impressions": reach,
        "spend": item.get("spend", 0),
        
        # EU Daten weiterleiten für das Detail-Modal
        "targeted_or_reached_countries": item.get("targeted_or_reached_countries", []),
        "eu_data": item.get("eu_data") or item.get("euAudienceData") or item.get("eu_transparency"), 
        
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
    STRATEGIE: 'Winning Products' + 'Reach Sorting'
    1. Filter: Nur Ads, die ÄLTER als 30 Tage sind (start_date[max]).
    2. Buffer: Lädt 5x mehr Ads, um eine Auswahl zu haben.
    3. Sortierung: Sortiert intern nach Reichweite und gibt die Top-X zurück.
    """
    # Country Mapping
    target_country = country.upper() if country and country != "ALL" else "US"
    
    # 1. Datum berechnen: Heute vor 30 Tagen
    # Alles was VOR diesem Datum gestartet ist (und noch aktiv ist), gilt als "Winning Product"
    cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    
    # URL Konstruktion
    # start_date[max] = "Startdatum darf maximal der 09.11. sein" (also älter)
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={query}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped"
        f"&start_date[max]={cutoff_date}" 
        f"&media_type=all"
    )

    # 2. BUFFER-LOGIK: Wir holen mehr Daten, um sortieren zu können
    # Faktor 5: Wenn User 10 will, holen wir 50 (maximal 100)
    scrape_limit = limit * 5 
    if scrape_limit > 100: scrape_limit = 100 

    # Actor Input Konfiguration
    # WICHTIG: 'urls' statt 'startUrls' für diesen Actor!
    run_input = {
        "urls": [{"url": search_url}],
        "count": scrape_limit,      # Wir bestellen mehr...
        "maxItems": scrape_limit,   # ...um Auswahl zu haben
        
        "pageTimeoutSecs": 60,
        "proxy": {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"]
        },
        
        # ZWINGEND: Details scrapen (für EU-Reichweite!)
        "scrapeAdDetails": True, 
        "countryCode": target_country
    }

    print(f"DEBUG: Scrape (Buffer={scrape_limit}) 'Winning Products' (< {cutoff_date}) für '{query}'")

    try:
        # Führe den Call in einem Threadpool aus
        loop = asyncio.get_event_loop()
        run = await loop.run_in_executor(None, lambda: client.actor("curious_coder/facebook-ads-library-scraper").call(
            run_input=run_input, 
            memory_mbytes=512, # 512MB reicht für 1 URL (spart Geld/Fehler)
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
            
            # A. Normalisieren
            normalized_results = []
            seen_ids = set()

            for item in dataset_items:
                norm = normalize_meta_ad(item)
                if norm: 
                    # Duplikate vermeiden
                    if norm['id'] in seen_ids: continue
                    seen_ids.add(norm['id'])
                    normalized_results.append(norm)
            
            # B. SORTIEREN NACH REICHWEITE (High to Low)
            # Wir nutzen den neuen, korrekten 'reach_estimate' Wert
            print(f"DEBUG: Sortiere {len(normalized_results)} Ads nach Reichweite...")
            
            normalized_results.sort(
                key=lambda x: (x.get('reach_estimate') or 0), 
                reverse=True
            )

            # C. Abschneiden auf das gewünschte Limit (z.B. Top 10)
            final_results = normalized_results[:limit]
            
            print(f"✅ Gebe Top {len(final_results)} Ads zurück.")
            return final_results
            
    except Exception as e:
        print(f"❌ Apify Error in search_meta_ads: {str(e)}")
        return []
    
    return []