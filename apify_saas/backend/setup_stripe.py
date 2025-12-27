import os
import stripe
from dotenv import load_dotenv

# 1. Lade die .env Datei aus dem gleichen Ordner
load_dotenv()

# 2. Hole den Key sicher aus der Umgebungsvariable
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")

if not STRIPE_API_KEY:
    print("❌ FEHLER: 'STRIPE_API_KEY' wurde nicht in der .env Datei gefunden.")
    print("Bitte stelle sicher, dass du das Skript aus dem 'backend' Ordner ausführst.")
    exit(1)

stripe.api_key = STRIPE_API_KEY

# Die URL, auf die der User nach der Zahlung geleitet wird
REDIRECT_URL = "https://app.stellaads.io/#/register?session_id={CHECKOUT_SESSION_ID}"

def create_products():
    print("🚀 Erstelle Stripe Produkte (Live Mode via .env)...")

    products = [
        # 1. STARTER (19€)
        {
            "name": "AdSpy Starter",
            "description": "1.500 Credits / Monat - Ideal für Einsteiger",
            "amount": 1900, 
            "metadata": {"plan_code": "starter", "credits": "1500"}
        },
        # 2. PRO (49€)
        {
            "name": "AdSpy Pro",
            "description": "5.000 Credits / Monat - Für Wachstums-Brands",
            "amount": 4900, 
            "metadata": {"plan_code": "pro", "credits": "5000"}
        },
        # 3. AGENCY (149€)
        {
            "name": "AdSpy Agency",
            "description": "15.000 Credits / Monat - Für Teams & Skalierung",
            "amount": 14900, 
            "metadata": {"plan_code": "agency", "credits": "15000"}
        },
        # 4. FOUNDER DEAL (24,50€ - Versteckt)
        {
            "name": "AdSpy Pro (Founder Deal)",
            "description": "5.000 Credits / Monat - 50% Lifetime Rabatt",
            "amount": 2450, 
            "metadata": {"plan_code": "pro", "credits": "5000"}
        }
    ]

    print("\n--- TEIL 1: FÜR DEIN BACKEND (apify_saas/backend/app/routers/payment.py) ---")
    print("PLAN_CREDITS = {")

    frontend_links = []

    for p in products:
        # Produkt erstellen
        product = stripe.Product.create(name=p["name"], description=p["description"])
        
        # Preis erstellen
        price = stripe.Price.create(
            product=product.id,
            unit_amount=p["amount"],
            currency="eur",
            recurring={"interval": "month"}
        )

        # Payment Link erstellen
        link = stripe.PaymentLink.create(
            line_items=[{"price": price.id, "quantity": 1}],
            after_completion={"type": "redirect", "redirect": {"url": REDIRECT_URL}}
        )

        # Output für Backend Config (IDs)
        print(f'    "{price.id}": {p["metadata"]["credits"]}, # {p["name"]}')
        
        # Merken für Frontend Output
        suffix = "FOUNDER" if "Founder" in p["name"] else p["metadata"]["plan_code"].upper()
        # Normal vs Deal Suffix Logik
        suffix_full = f"{suffix}_DEAL" if "Founder" in p["name"] else f"{suffix}_NORMAL"
        frontend_links.append(f'const LINK_{suffix_full} = "{link.url}"; // {p["amount"]/100}€')

    print("}")
    
    print("\n--- TEIL 2: FÜR DEIN FRONTEND (PricingPage.tsx & LeadCaptureModal.tsx) ---")
    for link_str in frontend_links:
        print(link_str)

if __name__ == "__main__":
    try:
        create_products()
        print("\n✅ Fertig! Die Schlüssel sind sicher.")
    except Exception as e:
        print(f"❌ Fehler: {e}")