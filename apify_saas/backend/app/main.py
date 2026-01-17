import stripe
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Deine bestehenden Imports
from app.core.config import settings
from app.routers import auth, user, search, demo

# --- 1. SETUP & CONFIG ---
load_dotenv() # Lädt Variablen aus .env
stripe.api_key = os.getenv("STRIPE_API_KEY")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- 2. CORS KONFIGURATION (UNVERÄNDERT) ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://apify-saas.vercel.app",
    "https://app.stellaads.io",  
    "https://stellaads.io"       
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://apify-saas.*\.vercel\.app", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. DATENMODELLE FÜR STRIPE ---
class CheckoutSessionRequest(BaseModel):
    price_id: str

# --- 4. ENDPOINTS ---

@app.get("/")
def root():
    return {"status": "active", "message": "Ad Spy API is running"}

# Deine bestehenden Router
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(demo.router, prefix="/api/v1/demo", tags=["Demo"])

# --- 5. NEUER STRIPE ENDPOINT ---
# Dieser Endpoint wird von deiner api.ts aufgerufen
@app.post("/api/v1/create-checkout-session")
async def create_checkout_session(
    data: CheckoutSessionRequest, 
    user_id: str = Query(..., description="Die ID des eingeloggten Users")
):
    """
    Erstellt eine dynamische Stripe Checkout Session für Abos ODER Top-Ups.
    """
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API Key ist nicht konfiguriert (Server Error)")

    try:
        # Wir fragen Stripe, was das für ein Preis ist (Abo oder Einmalzahlung?)
        price_info = stripe.Price.retrieve(data.price_id)
        
        # Automatische Erkennung: Abo oder Einmalzahlung?
        mode = 'subscription' if price_info.recurring else 'payment'

        # Domain URL Bestimmung (Lokal vs Produktion)
        # Wenn du lokal testest, leite auf localhost zurück.
        # In Produktion auf stellaads.io.
        # Hier hardcoden wir deine App-URL, da du Deployments nutzt.
        domain_url = "https://app.stellaads.io" 
        # TIPP: Falls du lokal testest, kannst du dies kurzzeitig ändern auf:
        # domain_url = "http://localhost:5173"
        
        success_url = f"{domain_url}/#/account?status=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{domain_url}/#/account?status=canceled"

        # Session erstellen
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card', 'paypal'],
            line_items=[
                {
                    'price': data.price_id,
                    'quantity': 1,
                },
            ],
            mode=mode, 
            success_url=success_url,
            cancel_url=cancel_url,
            # WICHTIG: Metadaten für den Webhook (damit die Credits ankommen)
            metadata={
                "user_id": user_id,
                "credits": price_info.metadata.get("credits", "0") 
            },
            client_reference_id=user_id,
        )
        
        return {"url": checkout_session.url}

    except Exception as e:
        print(f"Stripe Checkout Error: {str(e)}")
        # Gibt den Fehler an das Frontend zurück, damit man sieht was los ist
        raise HTTPException(status_code=400, detail=f"Stripe Error: {str(e)}")