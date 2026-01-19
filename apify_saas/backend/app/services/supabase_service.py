import datetime
import json
import os
from supabase import create_client, Client
from app.core.config import settings

def get_supabase() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    
    # --- DEBUG: Prüfen ob Key geladen wird ---
    if not key:
        print("❌ CRITICAL: SUPABASE_KEY is missing in Env!")
    else:
        print(f"🔧 Supabase Client init. Key ends with: ...{key[-5:]}")
    
    client = create_client(url, key)

    # !!! WICHTIG - DER FIX FÜR LEERE DATEN !!!
    # Wir setzen den Auth-Token explizit für den Postgrest-Client.
    # Das garantiert, dass der Service-Key (Admin) wirklich genutzt wird
    # und RLS (Sicherheitsregeln) umgangen werden.
    client.postgrest.auth(key)

    return client

# --- USER & CREDITS ---

def check_user_credits(user_id: str, required_credits: int) -> bool:
    client = get_supabase()
    try:
        response = client.table("profiles").select("credits").eq("id", user_id).maybe_single().execute()
        if response and hasattr(response, 'data') and response.data:
            return response.data.get('credits', 0) >= required_credits
    except Exception as e:
        print(f"⚠️ Credit Check Error: {e}")
    return False

def deduct_credits(user_id: str, amount: int):
    client = get_supabase()
    try:
        response = client.table("profiles").select("credits").eq("id", user_id).execute()
        
        if not response.data:
            print(f"❌ Deduct Error: User {user_id} nicht gefunden.")
            return

        current_credits = response.data[0].get('credits', 0)
        new_balance = max(0, current_credits - amount)

        print(f"💰 Deducting {amount}. Old: {current_credits} -> New: {new_balance}")

        # Update durchführen
        client.table("profiles").update({"credits": new_balance}).eq("id", user_id).execute()
        
        # Ledger (optional)
        try:
            client.table("credit_ledger").insert({
                "user_id": user_id, 
                "amount": -amount, 
                "description": "Search API Usage"
            }).execute()
        except:
            pass
    except Exception as e:
        print(f"❌ Deduct Critical Error: {e}")

# --- SEARCH CACHE & FEED ---

def get_cached_results(platform: str, keyword: str):
    client = get_supabase()
    try:
        response = client.table("search_cache")\
            .select("id, last_updated")\
            .eq("platform", platform)\
            .eq("query", keyword)\
            .order("last_updated", desc=True)\
            .limit(1)\
            .execute()

        if not response or not hasattr(response, 'data') or not response.data:
            return None
            
        cache_entry = response.data[0]
        ads_res = client.table("ad_results").select("data").eq("search_ref", cache_entry['id']).execute()
        if ads_res and ads_res.data:
            return [row['data'] for row in ads_res.data]
    except Exception as e:
        print(f"⚠️ Cache Error: {e}")
    return None

def create_search_record(platform: str, keyword: str, country: str):
    client = get_supabase()
    search_entry = {
        "platform": platform, 
        "query": keyword, 
        "country": country,
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    try:
        res = client.table("search_cache").insert(search_entry).execute()
        if res and res.data: return res.data[0]['id']
    except Exception:
        if "country" in search_entry: del search_entry["country"]
        try:
            res = client.table("search_cache").insert(search_entry).execute()
            if res and res.data: return res.data[0]['id']
        except Exception as e:
            print(f"❌ Failed to create search record: {e}")
    return None

def save_search_details(search_id: str, platform: str, results: list):
    if not results or not search_id: return
    client = get_supabase()
    try:
        ad_rows = []
        for ad in results:
            raw_id = ad.get('id') or ad.get('ad_archive_id') or ad.get('item_id')
            pid = str(raw_id) if raw_id else f"gen_{datetime.datetime.now().timestamp()}_{results.index(ad)}"
            ad_rows.append({"platform": platform, "platform_id": pid, "search_ref": search_id, "data": ad})
        
        if ad_rows:
            client.table("ad_results").upsert(ad_rows, on_conflict="platform, platform_id").execute()
    except Exception as e:
        print(f"❌ Background Save Error: {e}")

# --- PROFIL & SAVED ADS ---

def get_user_profile_data(user_id: str):
    client = get_supabase()
    try:
        print(f"🔍 Loading Profile for ID: {user_id}") # DEBUG
        
        # 1. Profil laden
        p_res = client.table("profiles").select("*").eq("id", user_id).execute() # single() entfernt um Fehler zu vermeiden
        
        # DEBUG: Was kam zurück?
        if not p_res.data:
            print(f"❌ Profile Data is EMPTY for ID: {user_id} - Authentication/RLS Issue?")
            # Wir geben ein Dummy-Objekt zurück, damit das Frontend nicht abstürzt
            return {"id": user_id, "credits": 0, "plan": "starter", "searchLimit": 100, "name": "Unknown", "savedAds": [], "searchHistory": []}
        else:
            print(f"✅ Profile Data Found: {p_res.data[0]}")

        profile = p_res.data[0]
        
        # 2. Saved Ads
        s_res = client.table("saved_ads").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        saved_ads = []
        if s_res and s_res.data:
            for item in s_res.data:
                saved_ads.append({"id": item['id'], "type": item['type'], "data": item['data'], "savedAt": item['created_at']})

        # Fallback Logic
        plan = profile.get("plan", "starter")
        limit = profile.get("search_limit")
        
        if not limit:
            if plan == 'pro': limit = 1000
            elif plan == 'enterprise': limit = 5000
            else: limit = 100

        # FIX: 'name' statt 'first_name' nutzen (wie in DB)
        user_name = profile.get("name") or profile.get("first_name") or "User"

        return {
            "id": user_id,
            "email": profile.get("email", ""),
            "name": user_name,
            "credits": profile.get("credits", 0),
            "plan": plan,
            "searchLimit": limit,
            "savedAds": saved_ads,
            "searchHistory": [] 
        }
    except Exception as e:
        # WICHTIG: Fehler ausgeben!
        print(f"❌ CRITICAL PROFILE ERROR: {e}")
        return {"id": user_id, "credits": 0, "plan": "starter", "searchLimit": 100, "savedAds": [], "searchHistory": []}

def add_saved_ad(user_id: str, ad_data: dict, ad_type: str):
    client = get_supabase()
    return client.table("saved_ads").insert({"user_id": user_id, "type": ad_type, "data": ad_data}).execute()

def delete_saved_ad(user_id: str, ad_id: str):
    client = get_supabase()
    return client.table("saved_ads").delete().eq("id", ad_id).eq("user_id", user_id).execute()

supabase = get_supabase()