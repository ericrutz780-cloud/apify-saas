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

# --- CACHING & SEARCH LOGIC ---

def get_cached_results(platform: str, keyword: str):
    supabase = get_supabase()
    
    response = supabase.table("search_cache")\
        .select("id, last_updated")\
        .eq("platform", platform)\
        .eq("query", keyword)\
        .order("last_updated", desc=True)\
        .limit(1)\
        .execute()

    if not response.data:
        return None 
        
    cache_entry = response.data[0]
    cache_id = cache_entry['id']
    
    last_updated_str = cache_entry['last_updated'].replace('Z', '+00:00')
    last_updated = datetime.datetime.fromisoformat(last_updated_str)
    
    now = datetime.datetime.now(datetime.timezone.utc)
    if (now - last_updated).days >= 1:
        return None

    print(f"Cache HIT für '{keyword}'! Lade aus DB...")

    ads_response = supabase.table("ad_results")\
        .select("data")\
        .eq("search_ref", cache_id)\
        .execute()
        
    return [row['data'] for row in ads_response.data]

def save_search_results(platform: str, keyword: str, results: list):
    if not results:
        return
        
    supabase = get_supabase()
    print(f"Speichere {len(results)} Ergebnisse für '{keyword}' in DB...")
    
    search_entry = {
        "platform": platform,
        "query": keyword,
        "parameters": {},
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    search_response = supabase.table("search_cache").insert(search_entry).execute()
    if not search_response.data:
        return
        
    search_id = search_response.data[0]['id']
    
    ad_rows = []
    for ad in results:
        raw_id = ad.get('id') or ad.get('ad_archive_id') or ad.get('item_id')
        platform_id = str(raw_id) if raw_id else f"gen_{datetime.datetime.now().timestamp()}"
        
        row = {
            "platform": platform,
            "platform_id": platform_id,
            "search_ref": search_id,
            "data": ad
        }
        ad_rows.append(row)
        
    if ad_rows:
        supabase.table("ad_results").upsert(ad_rows, on_conflict="platform, platform_id").execute()

# --- USER PROFILE & SAVED ADS (NEU) ---

def get_user_profile_data(user_id: str):
    """Lädt Credits, Gespeicherte Ads und die Suchhistorie."""
    supabase = get_supabase()
    
    # 1. Profil laden (Credits)
    profile_res = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    profile = profile_res.data if profile_res.data else {"credits": 0}
    
    # 2. Saved Ads laden
    saved_res = supabase.table("saved_ads").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    saved_ads = []
    if saved_res.data:
        for item in saved_res.data:
            saved_ads.append({
                "id": item['id'],
                "type": item['type'],
                "data": item['data'],
                "savedAt": item['created_at']
            })

    # 3. Suchhistorie aus dem Ledger rekonstruieren
    history_res = supabase.table("credit_ledger")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("description", "Search API Usage")\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()
        
    history = []
    if history_res.data:
        for h in history_res.data:
            history.append({
                "id": str(h['id']),
                "query": "Search", 
                "platform": "both",
                "timestamp": h['created_at'],
                "resultsCount": abs(h['amount']),
                "limit": abs(h['amount'])
            })

    return {
        "id": user_id,
        "email": profile.get("email", ""), 
        "name": profile.get("first_name", "User"),
        "credits": profile.get("credits", 0),
        "savedAds": saved_ads,
        "searchHistory": history
    }

def add_saved_ad(user_id: str, ad_data: dict, ad_type: str):
    supabase = get_supabase()
    row = {
        "user_id": user_id,
        "type": ad_type,
        "data": ad_data
    }
    return supabase.table("saved_ads").insert(row).execute()

def delete_saved_ad(user_id: str, ad_id: str):
    supabase = get_supabase()
    return supabase.table("saved_ads").delete().eq("id", ad_id).eq("user_id", user_id).execute()