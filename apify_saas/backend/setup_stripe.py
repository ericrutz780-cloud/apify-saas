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
    print("🚀 Erstelle NEUE Stripe Produkte & Preise (Monthly/Yearly)...")

    # Definition der neuen Paket-Struktur
    plans = [
        {
            "id": "starter",
            "name": "AdSpy Starter",
            "credits": 1500,
            "price_monthly": 4900,   # 49€
            "price_yearly": 46800,   # 39€ * 12 = 468€
        },
        {
            "id": "pro",
            "name": "AdSpy Pro",
            "credits": 10000,
            "price_monthly": 12900,  # 129€
            "price_yearly": 118800,  # 99€ * 12 = 1.188€
        },
        {
            "id": "enterprise", # Umbenannt von Agency
            "name": "AdSpy Enterprise",
            "credits": 50000,
            "price_monthly": 39900,  # 399€
            "price_yearly": 358800,  # 299€ * 12 = 3.588€
        }
    ]

    backend_config = []
    frontend_config = []

    for plan in plans:
        print(f"\n... Verarbeite {plan['name']} ...")
        
        # 1. Produkt erstellen (Ein Produkt für beide Laufzeiten)
        product = stripe.Product.create(
            name=plan["name"], 
            metadata={"plan_code": plan["id"], "credits": str(plan["credits"])}
        )

        # ---------------------------
        # A. MONTHLY PRICE & LINK
        # ---------------------------
        price_monthly = stripe.Price.create(
            product=product.id,
            unit_amount=plan["price_monthly"],
            currency="eur",
            recurring={"interval": "month"},
            metadata={"type": "monthly"}
        )
        
        link_monthly = stripe.PaymentLink.create(
            line_items=[{"price": price_monthly.id, "quantity": 1}],
            after_completion={"type": "redirect", "redirect": {"url": REDIRECT_URL}}
        )

        # ---------------------------
        # B. YEARLY PRICE & LINK
        # ---------------------------
        price_yearly = stripe.Price.create(
            product=product.id,
            unit_amount=plan["price_yearly"],
            currency="eur",
            recurring={"interval": "year"},
            metadata={"type": "yearly"}
        )

        link_yearly = stripe.PaymentLink.create(
            line_items=[{"price": price_yearly.id, "quantity": 1}],
            after_completion={"type": "redirect", "redirect": {"url": REDIRECT_URL}}
        )

        # Daten sammeln für Output
        # Backend braucht Mapping von PriceID -> Credits
        backend_config.append(f'    "{price_monthly.id}": {plan["credits"]}, # {plan["name"]} (Monthly)')
        backend_config.append(f'    "{price_yearly.id}": {plan["credits"]}, # {plan["name"]} (Yearly)')

        # Frontend braucht die Links
        base_name = plan["id"].upper()
        frontend_config.append(f'const LINK_{base_name}_MONTHLY = "{link_monthly.url}";')
        frontend_config.append(f'const LINK_{base_name}_YEARLY = "{link_yearly.url}";')

    # --- OUTPUT ---
    print("\n\n" + "="*60)
    print("✅ FERTIG! KOPIERE DAS IN DEINE DATEIEN:")
    print("="*60)

    print("\n--- 1. FÜR BACKEND (apify_saas/backend/app/routers/payment.py) ---")
    print("PLAN_CREDITS = {")
    for line in backend_config:
        print(line)
    print("}")
    
    print("\n--- 2. FÜR FRONTEND (PricingPage.tsx) ---")
    for line in frontend_config:
        print(line)
    print("\n")

if __name__ == "__main__":
    try:
        create_products()
    except Exception as e:
        print(f"❌ Fehler: {e}")