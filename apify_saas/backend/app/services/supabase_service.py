import datetime
import json
from supabase import create_client, Client
from app.core.config import settings

def get_supabase() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    return create_client(url, key)

# --- USER & CREDITS ---

def check_user_credits(user_id: str, required_credits: int) -> bool:
    supabase = get_supabase()
    try:
        response = supabase.table("profiles").select("credits").eq("id", user_id).maybe_single().execute()
        if response and hasattr(response, 'data') and response.data:
            return response.data.get('credits', 0) >= required_credits
    except Exception as e:
        print(f"⚠️ Credit Check Error: {e}")
    return False

def deduct_credits(user_id: str, amount: int):
    supabase = get_supabase()
    try:
        response = supabase.table("profiles").select("credits").eq("id", user_id).maybe_single().execute()
        if response and hasattr(response, 'data') and response.data:
            current = response.data.get('credits', 0)
            new_balance = max(0, current - amount)
            supabase.table("profiles").update({"credits": new_balance}).eq("id", user_id).execute()
            
            try:
                supabase.table("credit_ledger").insert({
                    "user_id": user_id, 
                    "amount": -amount, 
                    "description": "Search API Usage"
                }).execute()
            except:
                pass
    except Exception as e:
        print(f"⚠️ Deduct Error: {e}")

# --- SEARCH CACHE & FEED ---

def get_cached_results(platform: str, keyword: str):
    """
    HINWEIS: Diese Funktion wird nur noch explizit aufgerufen, nicht mehr automatisch.
    """
    supabase = get_supabase()
    try:
        response = supabase.table("search_cache")\
            .select("id, last_updated")\
            .eq("platform", platform)\
            .eq("query", keyword)\
            .order("last_updated", desc=True)\
            .limit(1)\
            .execute()

        if not response or not hasattr(response, 'data') or not response.data:
            return None
            
        cache_entry = response.data[0]
        # Ergebnisse laden
        ads_res = supabase.table("ad_results").select("data").eq("search_ref", cache_entry['id']).execute()
        if ads_res and ads_res.data:
            return [row['data'] for row in ads_res.data]
            
    except Exception as e:
        print(f"⚠️ Cache Error: {e}")
        
    return None

def create_search_record(platform: str, keyword: str, country: str):
    """
    Erstellt synchron den Parent-Eintrag in 'search_cache' und gibt die echte DB-ID zurück.
    """
    supabase = get_supabase()
    search_entry = {
        "platform": platform, 
        "query": keyword, 
        "country": country,
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    try:
        # Versuch mit Country
        res = supabase.table("search_cache").insert(search_entry).execute()
        if res and res.data:
            return res.data[0]['id']
    except Exception:
        # Fallback ohne Country (falls altes Schema)
        if "country" in search_entry: del search_entry["country"]
        try:
            res = supabase.table("search_cache").insert(search_entry).execute()
            if res and res.data:
                return res.data[0]['id']
        except Exception as e:
            print(f"❌ Failed to create search record: {e}")
    
    return None

def save_search_details(search_id: str, platform: str, results: list):
    """
    Speichert die Ads-Details im Hintergrund, verknüpft mit search_id.
    """
    if not results or not search_id: return
    supabase = get_supabase()
    
    print(f"💾 Background: Speichere {len(results)} Ads für Search-ID {search_id}...")
    
    try:
        ad_rows = []
        for ad in results:
            raw_id = ad.get('id') or ad.get('ad_archive_id') or ad.get('item_id')
            pid = str(raw_id) if raw_id else f"gen_{datetime.datetime.now().timestamp()}_{results.index(ad)}"
            
            ad_rows.append({
                "platform": platform,
                "platform_id": pid,
                "search_ref": search_id,
                "data": ad
            })
        
        # Batch Upsert (in Chunks falls nötig, hier einfach alles auf einmal da Limit meist < 1000)
        if ad_rows:
            supabase.table("ad_results").upsert(ad_rows, on_conflict="platform, platform_id").execute()
            print("✅ Background Save erfolgreich.")
            
    except Exception as e:
        print(f"❌ Background Save Error: {e}")

# --- PROFIL & SAVED ADS ---

def get_user_profile_data(user_id: str):
    supabase = get_supabase()
    try:
        p_res = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
        profile = p_res.data if p_res and p_res.data else {}
        
        s_res = supabase.table("saved_ads").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        saved_ads = []
        if s_res and s_res.data:
            for item in s_res.data:
                saved_ads.append({
                    "id": item['id'], "type": item['type'], "data": item['data'], "savedAt": item['created_at']
                })

        return {
            "id": user_id,
            "email": profile.get("email", ""),
            "name": profile.get("first_name", "User"),
            "credits": profile.get("credits", 0),
            "savedAds": saved_ads,
            "searchHistory": [] 
        }
    except Exception as e:
        print(f"⚠️ Profile Load Error: {e}")
        return {"id": user_id, "credits": 0, "savedAds": [], "searchHistory": []}

def add_saved_ad(user_id: str, ad_data: dict, ad_type: str):
    supabase = get_supabase()
    return supabase.table("saved_ads").insert({"user_id": user_id, "type": ad_type, "data": ad_data}).execute()

def delete_saved_ad(user_id: str, ad_id: str):
    supabase = get_supabase()
    return supabase.table("saved_ads").delete().eq("id", ad_id).eq("user_id", user_id).execute()