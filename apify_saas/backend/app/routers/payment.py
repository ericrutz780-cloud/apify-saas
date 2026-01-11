import os
import stripe
from fastapi import APIRouter, Request, HTTPException, Header
from app.services.supabase_service import get_supabase

router = APIRouter()

# Environment Variablen laden
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

stripe.api_key = STRIPE_API_KEY

# --- KONFIGURATION START ---
# ⚠️ WICHTIG: Ersetze die Platzhalter unten mit den IDs aus dem Terminal-Output von setup_stripe.py!

PLAN_CREDITS = {
    # STARTER (1.500 Credits)
    "price_DEINE_ID_STARTER_MONATLICH": 1500,
    "price_DEINE_ID_STARTER_JAEHRLICH": 1500,

    # PRO (10.000 Credits)
    "price_DEINE_ID_PRO_MONATLICH":     10000,
    "price_DEINE_ID_PRO_JAEHRLICH":     10000,

    # ENTERPRISE (50.000 Credits)
    "price_DEINE_ID_ENTERPRISE_MONATLICH": 50000,
    "price_DEINE_ID_ENTERPRISE_JAEHRLICH": 50000,
}

PLAN_NAMES = {
    # Hier dieselben "price_" IDs nochmal eintragen:
    "price_DEINE_ID_STARTER_MONATLICH": "starter",
    "price_DEINE_ID_STARTER_JAEHRLICH": "starter",

    "price_DEINE_ID_PRO_MONATLICH":     "pro",
    "price_DEINE_ID_PRO_JAEHRLICH":     "pro",

    "price_DEINE_ID_ENTERPRISE_MONATLICH": "enterprise",
    "price_DEINE_ID_ENTERPRISE_JAEHRLICH": "enterprise",
}
# --- KONFIGURATION ENDE ---


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Dieser Webhook wird von Stripe aufgerufen, wenn eine Zahlung erfolgreich war.
    """
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Wir reagieren nur auf erfolgreiche Checkout-Sessions
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Daten aus der Session extrahieren
        user_email = session.get('customer_details', {}).get('email')
        
        # Wir holen die Line Items, um die Price ID zu finden
        line_items = stripe.checkout.Session.list_line_items(session['id'], limit=1)
        if not line_items or not line_items['data']:
            print("⚠️ Keine Line Items in Session gefunden.")
            return {"status": "ignored"}

        price_id = line_items['data'][0]['price']['id']
        
        # Credits und Plan basierend auf der ID ermitteln
        credits = PLAN_CREDITS.get(price_id, 0)
        plan = PLAN_NAMES.get(price_id, 'starter')

        if user_email and credits > 0:
            print(f"💰 Zahlung erhalten: {user_email} -> {credits} Credits ({plan})")
            await fulfill_order(user_email, credits, plan, session['id'])
        else:
            print(f"⚠️ Unbekannte Price ID ({price_id}) oder keine Email.")

    return {"status": "success"}

async def fulfill_order(email: str, credits: int, plan: str, session_id: str):
    """
    Schreibt Credits gut.
    1. Prüft, ob User in 'profiles' existiert -> Update.
    2. Falls nicht -> Schreibt in 'pending_credits' (Wird bei Registrierung abgeholt).
    """
    supabase = get_supabase()
    
    # 1. Existiert der User schon?
    res = supabase.table("profiles").select("*").eq("email", email).maybe_single().execute()
    
    if res and hasattr(res, 'data') and res.data:
        # JA: User existiert -> Direkt gutschreiben
        current_credits = res.data.get('credits', 0)
        new_credits = current_credits + credits
        
        # Update Credits & Plan
        supabase.table("profiles").update({
            "credits": new_credits, 
            "plan": plan
        }).eq("email", email).execute()
        
        print(f"✅ Credits direkt gutgeschrieben für {email}. Neuer Stand: {new_credits}")
    else:
        # NEIN: User existiert noch nicht -> In Pending-Tabelle speichern
        print(f"⏳ User {email} noch nicht registriert. Speichere in pending_credits.")
        
        supabase.table("pending_credits").upsert({
            "email": email,
            "credits": credits,
            "plan": plan,
            "stripe_session_id": session_id
        }).execute()