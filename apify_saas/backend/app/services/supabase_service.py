import datetime
from supabase import create_client, Client
from app.core.config import settings

def get_supabase() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    return create_client(url, key)

# --- USER & CREDITS ---

def check_user_credits(user_id: str, required_credits: int) -> bool:
    supabase = get_supabase()
    # "maybe_single" verhindert Absturz, wenn User nicht gefunden wird
    response = supabase.table("profiles").select("credits").eq("id", user_id).maybe_single().execute()
    if response.data:
        return response.data.get('credits', 0) >= required_credits
    return False # User nicht gefunden oder keine Credits

def deduct_credits(user_id: str, amount: int):
    supabase = get_supabase()
    response = supabase.table("profiles").select("credits").eq("id", user_id).maybe_single().execute()
    
    if response.data:
        current = response.data.get('credits', 0)
        new_balance = max(0, current - amount)
        supabase.table("profiles").update({"credits": new_balance}).eq("id", user_id).execute()
        
        # Log schreiben (Fehler hier ignorieren wir, damit der Flow nicht bricht)
        try:
            supabase.table("credit_ledger").insert({
                "user_id": user_id, 
                "amount": -amount, 
                "description": "Search API Usage"
            }).execute()
        except:
            pass

# --- SEARCH CACHE ---

def get_cached_results(platform: str, keyword: str):
    supabase = get_supabase()
    # Prüfen auf Cache jünger als 24h
    response = supabase.table("search_cache")\
        .select("id, last_updated")\
        .eq("platform", platform)\
        .eq("query", keyword)\
        .order("last_updated", desc=True)\
        .limit(1)\
        .execute()

    if not response.data: return None
        
    cache_entry = response.data[0]
    # Datums-Check (simpel)
    last_updated_str = cache_entry['last_updated'].replace('Z', '+00:00')
    last_updated = datetime.datetime.fromisoformat(last_updated_str)
    if (datetime.datetime.now(datetime.timezone.utc) - last_updated).days >= 1:
        return None

    # Daten laden
    ads_res = supabase.table("ad_results").select("data").eq("search_ref", cache_entry['id']).execute()
    return [row['data'] for row in ads_res.data]

def save_search_results(platform: str, keyword: str, results: list):
    if not results: return
    supabase = get_supabase()
    
    # Cache Eintrag
    search_entry = {
        "platform": platform, 
        "query": keyword, 
        "parameters": {}, 
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    res = supabase.table("search_cache").insert(search_entry).execute()
    if not res.data: return
    
    search_id = res.data[0]['id']
    
    # Ads speichern
    ad_rows = []
    for ad in results:
        raw_id = ad.get('id') or ad.get('ad_archive_id') or ad.get('item_id')
        pid = str(raw_id) if raw_id else f"gen_{datetime.datetime.now().timestamp()}"
        ad_rows.append({
            "platform": platform,
            "platform_id": pid,
            "search_ref": search_id,
            "data": ad
        })
    
    if ad_rows:
        supabase.table("ad_results").upsert(ad_rows, on_conflict="platform, platform_id").execute()

# --- PROFIL & SAVED ADS (WICHTIG FÜR LOGIN) ---

def get_user_profile_data(user_id: str):
    supabase = get_supabase()
    
    # 1. Profil laden (Fehlertolerant)
    p_res = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    profile = p_res.data if p_res.data else {}
    
    # 2. Saved Ads
    s_res = supabase.table("saved_ads").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    saved_ads = []
    if s_res.data:
        for item in s_res.data:
            saved_ads.append({
                "id": item['id'], "type": item['type'], "data": item['data'], "savedAt": item['created_at']
            })

    # 3. History (Mock aus Ledger)
    history = []
    try:
        h_res = supabase.table("credit_ledger").select("*").eq("user_id", user_id).eq("description", "Search API Usage").order("created_at", desc=True).limit(10).execute()
        if h_res.data:
            for h in h_res.data:
                history.append({
                    "id": str(h['id']), "query": "Search", "platform": "both", 
                    "timestamp": h['created_at'], "resultsCount": abs(h['amount']), "limit": abs(h['amount'])
                })
    except:
        pass # Falls Ledger leer oder Fehler

    return {
        "id": user_id,
        "email": profile.get("email", ""),
        "name": profile.get("first_name", "User"),
        "credits": profile.get("credits", 0), # Wichtig: Default 0 falls leer
        "savedAds": saved_ads,
        "searchHistory": history
    }

def add_saved_ad(user_id: str, ad_data: dict, ad_type: str):
    supabase = get_supabase()
    return supabase.table("saved_ads").insert({"user_id": user_id, "type": ad_type, "data": ad_data}).execute()

def delete_saved_ad(user_id: str, ad_id: str):
    supabase = get_supabase()
    return supabase.table("saved_ads").delete().eq("id", ad_id).eq("user_id", user_id).execute()