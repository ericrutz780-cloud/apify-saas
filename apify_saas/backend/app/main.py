import stripe
import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.routers import auth, user, search, demo, payment

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. SETUP & CONFIG ---
load_dotenv() 
stripe.api_key = os.getenv("STRIPE_API_KEY")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- 2. CORS KONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. DATENMODELLE ---
class CheckoutSessionRequest(BaseModel):
    price_id: str

# NEU: Modell für Kontaktformular
class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

# --- 4. ENDPOINTS ---

@app.get("/")
def root():
    return {"status": "active", "message": "Ad Spy API is running"}

# NEU: Kontakt-Endpoint
@app.post("/api/v1/contact")
async def handle_contact_form(data: ContactRequest):
    """
    Empfängt Kontaktanfragen und loggt sie in der Server-Konsole.
    """
    # 1. In den Server-Logs ausgeben (sichtbar in Render)
    print(f"\n📨 === NEW CONTACT REQUEST === 📨")
    print(f"From: {data.name} ({data.email})")
    print(f"Message: {data.message}")
    print(f"==================================\n")
    
    # 2. Hier könnte später echter E-Mail Versand (SMTP/SendGrid) hin.
    
    return {"status": "success", "message": "Request received and logged."}

# Router Registrierung
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(demo.router, prefix="/api/v1/demo", tags=["Demo"])
app.include_router(payment.router, prefix="/api/v1/payment", tags=["Payment"])

# --- 5. STRIPE ENDPOINT ---
@app.post("/api/v1/create-checkout-session")
async def create_checkout_session(
    data: CheckoutSessionRequest, 
    user_id: str = Query(..., description="User ID")
):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe API Key missing")

    try:
        price_info = stripe.Price.retrieve(data.price_id)
        mode = 'subscription' if price_info.recurring else 'payment'
        
        domain_url = "https://app.stellaads.io"
        
        success_url = f"{domain_url}/#/account?status=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{domain_url}/#/account?status=canceled"

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card', 'paypal'],
            line_items=[{'price': data.price_id, 'quantity': 1}],
            mode=mode, 
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user_id, "credits": price_info.metadata.get("credits", "0")},
            client_reference_id=user_id,
        )
        
        return {"url": checkout_session.url}

    except Exception as e:
        logger.error(f"Stripe Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe Error: {str(e)}")