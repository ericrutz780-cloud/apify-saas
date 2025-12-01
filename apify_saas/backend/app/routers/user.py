from fastapi import APIRouter, HTTPException, Body
from app.services.supabase_service import get_user_profile_data, add_saved_ad, delete_saved_ad

router = APIRouter()

@router.get("/me")
def get_my_profile(user_id: str):
    try:
        return get_user_profile_data(user_id)
    except Exception as e:
        print(f"Profile Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/saved-ads")
def save_ad(user_id: str = Body(...), type: str = Body(...), data: dict = Body(...)):
    try:
        add_saved_ad(user_id, data, type)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/saved-ads/{ad_id}")
def remove_ad(ad_id: str, user_id: str):
    try:
        delete_saved_ad(user_id, ad_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))