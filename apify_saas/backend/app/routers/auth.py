from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel, EmailStr
# WICHTIG: Wir importieren get_supabase, um frische Clients zu erstellen
from app.services.supabase_service import supabase, get_supabase 

router = APIRouter()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class PasswordChange(BaseModel):
    user_id: str
    email: str
    old_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

@router.post("/register")
def register(user: UserRegister):
    try:
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Registration failed")
            
        # Initiales Profil erstellen
        supabase.table("profiles").insert({
            "id": response.user.id,
            "email": user.email,
            "credits": 1500, # Startguthaben
            "plan": "starter"
        }).execute()
        
        return {"message": "User created successfully", "user": response.user}
    except Exception as e:
        print(f"Register Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(user: UserLogin):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if not response.user:
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
        print(f"Login Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid credentials")

# --- KORRIGIERT: PASSWORT ÄNDERN ---
@router.post("/change-password")
def change_password(data: PasswordChange):
    # Wir erstellen einen NEUEN Client-Instanz für diesen Request.
    # Das verhindert, dass wir den globalen Admin-Client Status verändern.
    client = get_supabase()
    
    try:
        # 1. Login versuch mit ALTEM Passwort
        # Das prüft automatisch, ob das alte Passwort stimmt.
        auth_res = client.auth.sign_in_with_password({
            "email": data.email,
            "password": data.old_password
        })
        
        if not auth_res.user:
            raise HTTPException(status_code=401, detail="Das alte Passwort ist falsch.")

        # 2. Passwort Update als eingeloggter User durchführen
        # Da wir jetzt eine Session im 'client' haben, können wir update_user nutzen.
        # Das braucht KEINE Admin-Rechte!
        client.auth.update_user({"password": data.new_password})
        
        # Sauber ausloggen
        client.auth.sign_out()
        
        return {"message": "Password updated successfully"}

    except Exception as e:
        print(f"Change Password Error: {e}")
        if "Invalid login credentials" in str(e):
            raise HTTPException(status_code=401, detail="Das alte Passwort ist falsch.")
        raise HTTPException(status_code=400, detail=f"Fehler beim Ändern: {str(e)}")

@router.post("/reset-password")
def reset_password(data: PasswordResetRequest):
    try:
        # Sendet eine Reset E-Mail
        supabase.auth.reset_password_for_email(
            data.email,
            {"redirect_to": "https://app.stellaads.io/#/account?tab=security"} 
        )
        return {"message": "Falls die E-Mail existiert, wurde ein Reset-Link gesendet."}
    except Exception as e:
        print(f"Reset Password Error: {e}")
        return {"message": "Falls die E-Mail existiert, wurde ein Reset-Link gesendet."}