from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel, EmailStr
from app.services.supabase_service import supabase

router = APIRouter()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str

# NEU: Modelle für Passwort-Änderungen
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

# --- NEU: PASSWORT ÄNDERN (Eingeloggt) ---
@router.post("/change-password")
def change_password(data: PasswordChange):
    try:
        # 1. Sicherheits-Check: Wir versuchen uns mit dem ALTEN Passwort einzuloggen.
        # Wenn das fehlschlägt, gehört der Account nicht dem User oder das alte PW ist falsch.
        check_res = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.old_password
        })
        
        if not check_res.user:
            raise HTTPException(status_code=401, detail="Das alte Passwort ist falsch.")

        # 2. Wenn Login erfolgreich, updaten wir das Passwort auf das neue
        update_res = supabase.auth.admin.update_user_by_id(
            data.user_id,
            {"password": data.new_password}
        )
        
        return {"message": "Password updated successfully"}

    except Exception as e:
        print(f"Change Password Error: {e}")
        # Wir wollen dem Frontend sagen, wenn das alte PW falsch war
        if "Invalid login credentials" in str(e):
            raise HTTPException(status_code=401, detail="Das alte Passwort ist falsch.")
        raise HTTPException(status_code=400, detail=str(e))

# --- NEU: PASSWORT VERGESSEN (Ausgeloggt) ---
@router.post("/reset-password")
def reset_password(data: PasswordResetRequest):
    try:
        # Sendet eine Magic Link / Reset E-Mail an den User
        # Du musst in Supabase unter Auth -> Email Templates die URL anpassen, 
        # damit sie auf deine App zeigt (z.B. https://app.stellaads.io/update-password)
        supabase.auth.reset_password_for_email(
            data.email,
            {"redirect_to": "https://app.stellaads.io/#/account?tab=security"} 
        )
        return {"message": "Falls die E-Mail existiert, wurde ein Reset-Link gesendet."}
    except Exception as e:
        print(f"Reset Password Error: {e}")
        # Aus Sicherheitsgründen geben wir immer OK zurück, auch wenn Email nicht existiert
        return {"message": "Falls die E-Mail existiert, wurde ein Reset-Link gesendet."}