import datetime
from supabase import create_client, Client
from app.core.config import settings

# 1. Verbindung zur Datenbank herstellen
def get_supabase() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    return create_client(url, key)

# --- USER & CREDITS LOGIC ---

def check_user_credits(user_id: str, required_credits: int) -> bool:
    """Prüft, ob der Nutzer genug Credits hat."""
    supabase = get_supabase()
    response = supabase.table("profiles").select("credits").eq("id", user_id).execute()
    if response.data:
        return response.data[0]['credits'] >= required_credits
    return False

def deduct_credits(user_id: str, amount: int):
    """Zieht Credits ab und schreibt einen Log-Eintrag."""
    supabase = get_supabase()
    
    # Aktuellen Stand holen
    response = supabase.table("profiles").select("credits").eq("id", user_id).execute()
    
    if response.data:
        current_credits = response.data[0]['credits']
        new_balance = max(0, current_credits - amount)
        
        # Neuen Stand speichern
        supabase.table("profiles").update({"credits": new_balance}).eq("id", user_id).execute()
        
        # Log-Eintrag für Transparenz
        supabase.table("credit_ledger").insert({
            "user_id": user_id,
            "amount": -amount,
            "description": "Search API Usage"
        }).execute()

# --- CACHING & SEARCH LOGIC (NEU!) ---

def get_cached_results(platform: str, keyword: str):
    """
    Sucht in der DB nach Ergebnissen für dieses Keyword, die jünger als 24h sind.
    Gibt Liste von Ads zurück ODER None (wenn nichts/zu alt).
    """
    supabase = get_supabase()
    
    # 1. Suche den neuesten Eintrag im Cache für diesen Begriff
    response = supabase.table("search_cache")\
        .select("id, last_updated")\
        .eq("platform", platform)\
        .eq("query", keyword)\
        .order("last_updated", desc=True)\
        .limit(1)\
        .execute()

    if not response.data:
        return None # Gar kein Cache vorhanden
        
    cache_entry = response.data[0]
    cache_id = cache_entry['id']
    
    # Datum parsen (ISO Format von Supabase)
    last_updated_str = cache_entry['last_updated'].replace('Z', '+00:00')
    last_updated = datetime.datetime.fromisoformat(last_updated_str)
    
    # 2. Prüfen: Ist der Cache älter als 24 Stunden?
    now = datetime.datetime.now(datetime.timezone.utc)
    if (now - last_updated).days >= 1:
        print(f"Cache für '{keyword}' ist zu alt (Expired).")
        return None

    print(f"Cache HIT für '{keyword}'! Lade aus DB...")

    # 3. Wenn Cache gültig: Die echten Ad-Daten laden
    # Wir joinen nicht, wir laden direkt basierend auf der search_ref
    ads_response = supabase.table("ad_results")\
        .select("data")\
        .eq("search_ref", cache_id)\
        .execute()
        
    # Wir packen die rohen JSON-Daten wieder aus
    return [row['data'] for row in ads_response.data]

def save_search_results(platform: str, keyword: str, results: list):
    """
    Speichert eine neue Suche und ihre Ergebnisse in der Datenbank (Tier 1).
    """
    if not results:
        return # Nichts zu speichern
        
    supabase = get_supabase()
    print(f"Speichere {len(results)} Ergebnisse für '{keyword}' in DB...")
    
    # 1. Cache-Log Eintrag erstellen
    search_entry = {
        "platform": platform,
        "query": keyword,
        "parameters": {}, # Platzhalter für Filter
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    search_response = supabase.table("search_cache").insert(search_entry).execute()
    if not search_response.data:
        print("Fehler beim Speichern des Search-Cache")
        return
        
    search_id = search_response.data[0]['id']
    
    # 2. Ergebnisse vorbereiten und speichern
    ad_rows = []
    for ad in results:
        # Wir versuchen eine eindeutige ID zu finden (Meta vs TikTok)
        # Meta: 'id' oder 'ad_archive_id'
        # TikTok: 'id' oder 'item_id'
        # Fallback: 'unknown' (sollte nicht passieren bei echten Daten)
        raw_id = ad.get('id') or ad.get('ad_archive_id') or ad.get('item_id')
        platform_id = str(raw_id) if raw_id else f"gen_{datetime.datetime.now().timestamp()}"
        
        row = {
            "platform": platform,
            "platform_id": platform_id,
            "search_ref": search_id,
            "data": ad # Das ganze JSON-Objekt
        }
        ad_rows.append(row)
        
    if ad_rows:
        # Upsert: Falls die Ad schon existiert, aktualisieren wir sie (und verlinken zur neuen Suche)
        # Wichtig: Dafür muss in Supabase der Unique-Constraint auf (platform, platform_id) existieren!
        supabase.table("ad_results").upsert(ad_rows, on_conflict="platform, platform_id").execute()
    
    print("✅ Speichern erfolgreich.")