from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional
from app.services.supabase_service import supabase

router = APIRouter()

# Modell für die Daten, die wir updaten wollen
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    # Hier können später weitere Felder hin (z.B. industry)

@router.get("/me")
def get_user_me(user_id: str):
    # 1. Profil aus 'profiles' Tabelle laden
    response = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    profile = response.data[0]
    
    # 2. Gespeicherte Ads laden (Optional, für Dashboard)
    saved_ads_res = supabase.table("saved_ads").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    profile["savedAds"] = saved_ads_res.data if saved_ads_res.data else []
    
    # 3. Suchverlauf laden (aus search_history Tabelle, falls vorhanden, sonst leer)
    # (Hier vereinfacht, da du den Verlauf aktuell lokal speicherst oder separat lädst)
    profile["searchHistory"] = [] 

    return profile

# --- NEU: UPDATE ENDPOINT ---
@router.patch("/me")
def update_user_me(
    user_id: str = Query(..., description="ID des Users"),
    update_data: UserUpdate = Body(...)
):
    """
    Aktualisiert Profil-Daten (z.B. Name) in der Supabase 'profiles' Tabelle.
    """
    # Filtere Felder heraus, die None sind (nicht gesendet wurden)
    data_to_update = {k: v for k, v in update_data.dict().items() if v is not None}
    
    # Sicherheit: Email-Änderungen sind komplex (Auth), wir ignorieren sie hier vorerst
    # oder erlauben nur Namensänderungen, um Konflikte mit Auth zu vermeiden.
    if "email" in data_to_update:
        del data_to_update["email"]

    if not data_to_update:
        return {"message": "No data to update"}

    # Update in Supabase durchführen
    response = supabase.table("profiles").update(data_to_update).eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Update failed")
        
    return response.data[0]