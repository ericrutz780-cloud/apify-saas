from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services import apify_demo_service
# Importiere Supabase Client direkt hier für den Lead-Speicher
from app.services.supabase_service import supabase 

router = APIRouter()

# --- MODELS ---
class DemoSearchRequest(BaseModel):
    keyword: str
    country: str = "US"
    limit: int = 30 

class LeadRequest(BaseModel):
    email: EmailStr
    industry: str
    goal: str

# --- ENDPOINTS ---

@router.post("/search")
async def demo_search_ads(request: DemoSearchRequest):
    # (Dieser Teil bleibt unverändert wie vorher)
    print(f"DEMO ROUTER: Searching for '{request.keyword}'")
    try:
        results = await apify_demo_service.search_demo_ads(
            query=request.keyword,
            country=request.country,
            limit=request.limit
        )
        return {
            "status": "success",
            "data": results,
            "meta": {"count": len(results)}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/lead")
async def save_lead(lead: LeadRequest):
    """Speichert den Lead in der Supabase Datenbank."""
    print(f"NEW LEAD: {lead.email} | {lead.industry}")
    
    try:
        # Versuch, in Tabelle 'leads' zu speichern
        data = {
            "email": lead.email,
            "industry": lead.industry,
            "goal": lead.goal,
            "source": "demo_popup",
            "created_at": "now()"
        }
        
        # Speichern in Supabase
        response = supabase.table("leads").insert(data).execute()
        
        return {"status": "success", "message": "Lead saved"}
        
    except Exception as e:
        print(f"ERROR SAVING LEAD: {e}")
        # Wir geben trotzdem Success zurück, damit der User im Frontend nicht frustriert ist,
        # aber loggen den Fehler im Backend.
        return {"status": "success", "message": "Received (Fallback)"}