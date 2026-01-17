import stripe
import os
from dotenv import load_dotenv

# Lade Umgebungsvariablen aus der .env Datei
load_dotenv()

# Hole den API Key sicher aus den Environment Variables
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")

if not STRIPE_API_KEY:
    print("FEHLER: STRIPE_API_KEY wurde nicht in der .env Datei gefunden!")
    exit(1)

stripe.api_key = STRIPE_API_KEY

def create_product(name, description, credits_amount):
    print(f"Erstelle Produkt: {name}...")
    try:
        product = stripe.Product.create(
            name=name,
            description=description,
            metadata={"credits": str(credits_amount)} # WICHTIG: Als String speichern
        )
        return product.id
    except Exception as e:
        print(f"Fehler beim Erstellen von {name}: {e}")
        return None

def create_price(product_id, amount_cents, interval=None, interval_count=1):
    if not product_id:
        return None
        
    price_data = {
        "product": product_id,
        "unit_amount": amount_cents,
        "currency": "eur",
    }
    
    if interval:
        price_data["recurring"] = {"interval": interval, "interval_count": interval_count}
    
    try:
        price = stripe.Price.create(**price_data)
        return price.id
    except Exception as e:
        print(f"Fehler beim Erstellen des Preises: {e}")
        return None

def main():
    print(f"--- STARTE STRIPE SETUP (Key: ...{STRIPE_API_KEY[-4:]}) ---\n")

    # 1. STARTER PLAN (3.000 Credits)
    p_starter = create_product("AdSpy Starter", "Starter Plan für Einsteiger", 3000)
    id_starter_monthly = create_price(p_starter, 4900, "month") # 49.00 EUR
    id_starter_yearly = create_price(p_starter, 46800, "year")  # 468.00 EUR (39*12 - 20%)

    # 2. PRO PLAN (50.000 Credits)
    p_pro = create_product("AdSpy Pro", "Pro Plan für Power-User", 50000)
    id_pro_monthly = create_price(p_pro, 12900, "month") # 129.00 EUR
    id_pro_yearly = create_price(p_pro, 118800, "year")  # 1188.00 EUR (99*12)

    # 3. TOP-UP PACKAGES (Einmalzahlung, 1.000 Credits)
    # WICHTIG: Die Credits sind immer 1.000, nur der Preis ändert sich je nach Plan-Level
    
    # Topup für Starter User (25€)
    p_topup_starter = create_product("Credit Top-up (Starter)", "1.000 Extra Credits", 1000)
    id_topup_starter = create_price(p_topup_starter, 2500) # Einmalig

    # Topup für Pro User (10€)
    p_topup_pro = create_product("Credit Top-up (Pro)", "1.000 Extra Credits", 1000)
    id_topup_pro = create_price(p_topup_pro, 1000) # Einmalig

    # Topup für Enterprise User (5€)
    p_topup_ent = create_product("Credit Top-up (Enterprise)", "1.000 Extra Credits", 1000)
    id_topup_ent = create_price(p_topup_ent, 500) # Einmalig

    print("\n" + "="*50)
    print("FERTIG! KOPIERE DIESE IDs IN DEINE frontend/App.tsx")
    print("="*50 + "\n")
    
    print("// Monthly Plans")
    print(f'const PRICE_ID_STARTER_MONTHLY    = "{id_starter_monthly}";')
    print(f'const PRICE_ID_PRO_MONTHLY        = "{id_pro_monthly}";')
    print("")
    print("// Yearly Plans")
    print(f'const PRICE_ID_STARTER_YEARLY     = "{id_starter_yearly}";')
    print(f'const PRICE_ID_PRO_YEARLY         = "{id_pro_yearly}";')
    print("")
    print("// Top-Up Credits")
    print(f'const PRICE_ID_TOPUP_STARTER      = "{id_topup_starter}";')
    print(f'const PRICE_ID_TOPUP_PRO          = "{id_topup_pro}";')
    print(f'const PRICE_ID_TOPUP_ENTERPRISE   = "{id_topup_ent}";')
    print("-" * 20)

if __name__ == "__main__":
    main()