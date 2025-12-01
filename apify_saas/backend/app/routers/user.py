from fastapi import APIRouter, HTTPException, Body
from app.services.supabase_service import get_user_profile_data, add_saved_ad, delete_saved_ad

router = APIRouter()

# 1. Profil laden
@router.get("/me")
def get_my_profile(user_id: str):
    try:
        return get_user_profile_data(user_id)
    except Exception as e:
        print(f"Error loading profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 2. Ad speichern
@router.post("/saved-ads")
def save_ad(user_id: str = Body(...), type: str = Body(...), data: dict = Body(...)):
    try:
        add_saved_ad(user_id, data, type)
        return {"status": "success", "message": "Ad saved"}
    except Exception as e:
        print(f"Error saving ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 3. Ad löschen
@router.delete("/saved-ads/{ad_id}")
def remove_ad(ad_id: str, user_id: str):
    try:
        delete_saved_ad(user_id, ad_id)
        return {"status": "success", "message": "Ad removed"}
    except Exception as e:
        print(f"Error removing ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))
