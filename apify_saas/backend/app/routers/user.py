from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional
# Wir importieren die Helper-Funktion UND das supabase Objekt
from app.services.supabase_service import get_user_profile_data, supabase

router = APIRouter()

# --- MODELL BLEIBT GLEICH ---
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

# --- GET ROUTE (HIER WAR DER FEHLER) ---
@router.get("/me")
def get_user_me(user_id: str):
    """
    Lädt das Benutzerprofil sicher über den Service.
    Verhindert 404-Fehler durch Nutzung des Admin-Clients.
    """
    # Anstatt hier manuell zu suchen und bei Fehlern abzustürzen,
    # nutzen wir die Funktion, die wir in supabase_service.py gehärtet haben.
    profile = get_user_profile_data(user_id)
    
    # Das garantiert, dass immer ein Profil zurückkommt, auch wenn die DB 'leer' sagt.
    return profile

# --- UPDATE ROUTE (BLEIBT ERHALTEN & FUNKTIONIERT) ---
@router.patch("/me")
def update_user_me(
    user_id: str = Query(..., description="ID des Users"),
    update_data: UserUpdate = Body(...)
):
    """
    Aktualisiert Profil-Daten (z.B. Name) in der Supabase 'profiles' Tabelle.
    """
    data_to_update = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if "email" in data_to_update:
        del data_to_update["email"]

    if not data_to_update:
        return {"message": "No data to update"}

    # Da unser 'supabase' Objekt jetzt den Admin-Key erzwingt,
    # funktionieren Updates hier sogar zuverlässiger als vorher!
    response = supabase.table("profiles").update(data_to_update).eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Update failed")
        
    return response.data[0]