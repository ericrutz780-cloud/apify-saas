from apify_client import ApifyClient
from app.core.config import settings
import uuid
import datetime

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

    return {
        "id": safe_id,
        "publisher_platform": item.get("publisher_platform", ["facebook"]),
        "start_date": item.get("start_date", ""),
        "page_name": item.get("page_name", "Unknown Page"),
        "page_profile_uri": item.get("page_profile_uri", "#"),
        "ad_library_url": item.get("ad_library_url", "#"),
        "likes": item.get("likes", 0),
        "impressions": item.get("impressions_with_index", {}).get("impressions_min", 0),
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

def fetch_meta_ads_live(keyword: str, country: str, limit: int, sort_by: str = "newest"):
    client = ApifyClient(token=settings.APIFY_TOKEN)
    target_country = country if country and country != "ALL" else "US"
    
    # Wir begrenzen das Datum auf die letzten 90 Tage, um alte Daten zu vermeiden
    start_date_min = (datetime.datetime.now() - datetime.timedelta(days=90)).strftime("%Y-%m-%d")
    
    sort_mode = "start_date_desc" 
    if sort_by == "relevancy":
        sort_mode = "relevancy_monthly_grouped"

    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country={target_country}&q={keyword}"
        f"&sort_data[direction]=desc&sort_data[mode]={sort_mode}"
        f"&start_date[min]={start_date_min}" 
        f"&media_type=all"
    )

    # HIER IST DER FIX: Wir nutzen 'count' statt 'maxItems'
    # Laut PDF/Screenshot ist 'count' der korrekte Parameter für diesen Actor.
    run_input = {
        "urls": [{"url": search_url}], 
        
        # --- DER ENTSCHEIDENDE PARAMETER ---
        "count": limit, 
        # -----------------------------------
        
        # Wir lassen die anderen zur Sicherheit drin, falls er seine API ändert
        "maxItems": limit, 
        "pageTimeoutSecs": 60,
        "proxy": {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"]
        },
    }

    try:
        print(f"🚀 Starte Scrape für {keyword} in {target_country} (Ziel: {limit} Ads)...")
        
        # Timeout zur Sicherheit auf 2 Minuten lassen
        run = client.actor("XtaWFhbtfxyzqrFmd").call(
            run_input=run_input, 
            memory_mbytes=512,
            timeout_secs=120 
        )
        
        if not run:
            print("⚠️ Scrape wurde abgebrochen (Timeout/User).")
            return []

        dataset_id = run.get("defaultDatasetId")
        if dataset_id:
            print(f"✅ Scrape beendet. Lade Daten aus Dataset {dataset_id}...")
            items = client.dataset(dataset_id).list_items(clean=True).items
            
            normalized_results = []
            seen_ids = set()

            for item in items:
                norm = normalize_meta_ad(item)
                if norm: 
                    if norm['id'] in seen_ids: continue
                    seen_ids.add(norm['id'])
                    normalized_results.append(norm)
                    
                    if len(normalized_results) >= limit:
                        break
            
            print(f"✅ Gebe {len(normalized_results)} bereinigte Ads zurück.")
            return normalized_results
            
    except Exception as e:
        print(f"❌ Apify Error: {str(e)}")
        return []
    
    return []