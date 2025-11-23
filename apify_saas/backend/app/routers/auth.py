from fastapi import APIRouter, HTTPException
from app.services.supabase_service import get_supabase
from app.models.auth_requests import UserAuth

router = APIRouter()

# 1. Registrierung
@router.post("/register")
def register_user(user: UserAuth):
    supabase = get_supabase()
    try:
        # Wir erstellen den User in Supabase Auth
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        
        if not response.user:
             raise HTTPException(status_code=400, detail="Registration failed")
             
        return {
            "message": "User created successfully", 
            "user_id": response.user.id,
            "email": response.user.email
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 2. Login
@router.post("/login")
def login_user(user: UserAuth):
    supabase = get_supabase()
    try:
        # Wir loggen den User ein und holen das Access Token
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if not response.session:
             raise HTTPException(status_code=400, detail="Login failed")
             
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))