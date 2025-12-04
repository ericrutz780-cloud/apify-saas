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
    try:
        response = supabase.table("profiles").select("credits").eq("id", user_id).maybe_single().execute()
        # FIX: Prüfen, ob response existiert, bevor wir .data lesen
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

# --- SEARCH CACHE ---

def get_cached_results(platform: str, keyword: str):
    supabase = get_supabase()
    try:
        response = supabase.table("search_cache")\
            .select("id, last_updated")\
            .eq("platform", platform)\
            .eq("query", keyword)\
            .order("last_updated", desc=True)\
            .limit(1)\
            .execute()

        # FIX: Der Crash-Verhinderer
        if not response or not hasattr(response, 'data') or not response.data:
            return None
            
        cache_entry = response.data[0]
        # Datum prüfen
        last_updated_str = cache_entry['last_updated'].replace('Z', '+00:00')
        last_updated = datetime.datetime.fromisoformat(last_updated_str)
        
        if (datetime.datetime.now(datetime.timezone.utc) - last_updated).days >= 1:
            return None

        print(f"✅ Cache HIT für {keyword}")
        
        # Ergebnisse laden
        ads_res = supabase.table("ad_results").select("data").eq("search_ref", cache_entry['id']).execute()
        if ads_res and ads_res.data:
            return [row['data'] for row in ads_res.data]
            
    except Exception as e:
        print(f"⚠️ Cache Error: {e}")
        
    return None

def save_search_results(platform: str, keyword: str, results: list):
    if not results: return
    supabase = get_supabase()
    
    print(f"💾 Speichere {len(results)} Ergebnisse in DB...")
    
    try:
        # 1. Cache Eintrag
        search_entry = {
            "platform": platform, 
            "query": keyword, 
            "parameters": {}, 
            "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        res = supabase.table("search_cache").insert(search_entry).execute()
        
        # FIX: Prüfen auf NoneType bevor wir weitermachen!
        if not res or not hasattr(res, 'data') or not res.data:
            print("❌ Fehler: Konnte Cache-Eintrag nicht schreiben. (Response war leer)")
            return
        
        search_id = res.data[0]['id']
        
        # 2. Ads speichern
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
        
        if ad_rows:
            supabase.table("ad_results").upsert(ad_rows, on_conflict="platform, platform_id").execute()
            print("✅ Speichern erfolgreich.")
            
    except Exception as e:
        print(f"❌ DB Save Error (Ignoriert): {e}")
        # Wir fangen den Fehler ab, damit das Programm NICHT abstürzt.
        # Der User sieht die Ergebnisse trotzdem!

# --- PROFIL ---

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
        # Fallback Profil statt Absturz
        return {"id": user_id, "credits": 0, "savedAds": [], "searchHistory": []}

def add_saved_ad(user_id: str, ad_data: dict, ad_type: str):
    supabase = get_supabase()
    return supabase.table("saved_ads").insert({"user_id": user_id, "type": ad_type, "data": ad_data}).execute()

def delete_saved_ad(user_id: str, ad_id: str):
    supabase = get_supabase()
    return supabase.table("saved_ads").delete().eq("id", ad_id).eq("user_id", user_id).execute()