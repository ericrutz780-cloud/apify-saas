import datetime
import json
import os
from supabase import create_client, Client
from app.core.config import settings
import logging

# Logger einrichten
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    
    if not key:
        print("❌ CRITICAL: SUPABASE_KEY is missing in Env!")
    
    client = create_client(url, key)
    
    # RLS Bypass für Admin-Operationen (Service Role Key muss genutzt werden)
    try:
        client.postgrest.auth(key)
    except:
        pass

    return client

# --- USER & CREDITS ---

def check_user_credits(user_id: str, required_credits: int) -> bool:
    client = get_supabase()
    try:
        response = client.table("profiles").select("credits").eq("id", user_id).maybe_single().execute()
        if response and hasattr(response, 'data') and response.data:
            return response.data.get('credits', 0) >= required_credits
    except Exception as e:
        logger.error(f"⚠️ Credit Check Error: {e}")
    return False

def deduct_credits(user_id: str, amount: int):
    client = get_supabase()
    try:
        response = client.table("profiles").select("credits").eq("id", user_id).execute()
        
        if not response.data:
            logger.error(f"❌ Deduct Error: User {user_id} nicht gefunden.")
            return

        current_credits = response.data[0].get('credits', 0)
        new_balance = max(0, current_credits - amount)

        logger.info(f"💰 Deducting {amount}. Old: {current_credits} -> New: {new_balance}")

        # Update durchführen
        client.table("profiles").update({"credits": new_balance}).eq("id", user_id).execute()
        
        # Ledger Eintrag (optional, Fail-Safe)
        try:
            client.table("credit_ledger").insert({
                "user_id": user_id, 
                "amount": -amount, 
                "description": "Search API Usage"
            }).execute()
        except:
            pass
    except Exception as e:
        logger.error(f"❌ Deduct Critical Error: {e}")

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
        logger.warning(f"⚠️ Cache Error: {e}")
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
        # Fallback falls country Probleme macht
        if "country" in search_entry: del search_entry["country"]
        try:
            res = client.table("search_cache").insert(search_entry).execute()
            if res and res.data: return res.data[0]['id']
        except Exception as e:
            logger.error(f"❌ Failed to create search record: {e}")
    return None

def save_search_details(search_id: str, platform: str, results: list):
    """
    Speichert Ergebnisse in Batches, um Memory Overload zu verhindern.
    """
    if not results or not search_id: return
    client = get_supabase()
    
    # Batch-Größe (50 ist sicher für Render Free Tier)
    BATCH_SIZE = 50
    
    try:
        total_batches = (len(results) + BATCH_SIZE - 1) // BATCH_SIZE
        logger.info(f"💾 Saving {len(results)} items in {total_batches} batches...")

        ad_rows_batch = []
        for i, ad in enumerate(results):
            raw_id = ad.get('id') or ad.get('ad_archive_id') or ad.get('item_id')
            pid = str(raw_id) if raw_id else f"gen_{datetime.datetime.now().timestamp()}_{i}"
            
            ad_rows_batch.append({
                "platform": platform, 
                "platform_id": pid, 
                "search_ref": search_id, 
                "data": ad
            })

            # Wenn Batch voll ist oder es das letzte Element ist -> Senden
            if len(ad_rows_batch) >= BATCH_SIZE or i == len(results) - 1:
                try:
                    client.table("ad_results").upsert(ad_rows_batch, on_conflict="platform, platform_id").execute()
                    ad_rows_batch = [] # Reset Batch
                except Exception as batch_error:
                    logger.error(f"❌ Error saving batch {i//BATCH_SIZE}: {batch_error}")
        
        logger.info("✅ All batches saved successfully.")

    except Exception as e:
        logger.error(f"❌ Background Save Critical Error: {e}")

# --- PROFIL & SAVED ADS ---

def get_user_profile_data(user_id: str):
    client = get_supabase()
    try:
        logger.info(f"🔍 Loading Profile for ID: {user_id}")
        
        # 1. Profil laden
        p_res = client.table("profiles").select("*").eq("id", user_id).execute()
        
        if not p_res.data:
            logger.warning(f"❌ Profile Data is EMPTY for ID: {user_id}")
            return {"id": user_id, "credits": 0, "plan": "starter", "searchLimit": 100, "name": "Unknown", "savedAds": [], "searchHistory": []}
        else:
            logger.info(f"✅ Profile Data Found: {p_res.data[0]}")

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
        logger.error(f"❌ CRITICAL PROFILE ERROR: {e}")
        return {"id": user_id, "credits": 0, "plan": "starter", "searchLimit": 100, "savedAds": [], "searchHistory": []}

def add_saved_ad(user_id: str, ad_data: dict, ad_type: str):
    client = get_supabase()
    return client.table("saved_ads").insert({"user_id": user_id, "type": ad_type, "data": ad_data}).execute()

def delete_saved_ad(user_id: str, ad_id: str):
    client = get_supabase()
    return client.table("saved_ads").delete().eq("id", ad_id).eq("user_id", user_id).execute()

supabase = get_supabase()