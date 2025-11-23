from supabase import create_client, Client
from app.core.config import settings

# 1. Verbindung zur Datenbank herstellen
def get_supabase() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_KEY
    return create_client(url, key)

# 2. Funktion: Hat der Nutzer genug Credits?
def check_user_credits(user_id: str, required_credits: int) -> bool:
    supabase = get_supabase()
    
    # Wir fragen die Tabelle 'profiles' ab
    response = supabase.table("profiles").select("credits").eq("id", user_id).execute()
    
    if response.data:
        current_credits = response.data[0]['credits']
        return current_credits >= required_credits
    return False

# 3. Funktion: Credits abziehen (nach erfolgreicher Suche)
def deduct_credits(user_id: str, amount: int):
    supabase = get_supabase()
    
    # Aktuellen Stand holen
    response = supabase.table("profiles").select("credits").eq("id", user_id).execute()
    
    if response.data:
        current_credits = response.data[0]['credits']
        new_balance = current_credits - amount
        
        # Neuen Stand speichern
        supabase.table("profiles").update({"credits": new_balance}).eq("id", user_id).execute()
        
        # Log-Eintrag schreiben (für Transparenz)
        supabase.table("credit_ledger").insert({
            "user_id": user_id,
            "amount": -amount,
            "description": "Search API Usage"
        }).execute()