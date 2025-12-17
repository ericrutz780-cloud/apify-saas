import os
import time
import json
import requests
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client # WICHTIG: Supabase Import hinzugefügt

# --- KONFIGURATION & SICHERES LADEN DER ENV ---

# 1. Pfad zur .env Datei bestimmen
env_path = Path(__file__).resolve().parent / '.env'

# 2. .env laden mit override=True
load_dotenv(dotenv_path=env_path, override=True)

# 3. Variablen auslesen
ACCESS_TOKEN = os.getenv("FB_ACCESS_TOKEN")
AD_ACCOUNT_ID = os.getenv("FB_AD_ACCOUNT_ID")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_VERSION = "v24.0"

# 4. Sicherheits-Check beim Start
if not ACCESS_TOKEN or not AD_ACCOUNT_ID or not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ FEHLER: Zugangsdaten nicht gefunden! Prüfe backend/.env")
    exit(1)

print(f"✅ Konfiguration geladen.")
print(f"🔑 Token Start: {ACCESS_TOKEN[:10]}...")
print(f"🆔 Account ID: {AD_ACCOUNT_ID}")
print("-" * 30)

# --- SUPABASE CLIENT INIT ---
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"❌ Fehler beim Supabase Init: {e}")
    exit(1)

# --- API FUNKTION ---

def get_delivery_estimate(country_code, age_min, age_max, gender_id):
    url = f"https://graph.facebook.com/{API_VERSION}/act_{AD_ACCOUNT_ID}/delivery_estimate"
    
    targeting_spec = {
        "geo_locations": {"countries": [country_code]},
        "age_min": age_min,
        "age_max": age_max,
        "genders": [gender_id],
        "publisher_platforms": ["facebook", "instagram"]
    }

    params = {
        'optimization_goal': 'REACH',
        'targeting_spec': json.dumps(targeting_spec),
        'daily_budget': 10000, 
        'summary': 'true',
        'access_token': ACCESS_TOKEN
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        if response.status_code == 200:
            estimate = data.get('data', [{}])[0]
            mau = estimate.get('estimate_mau', -1)
            dau = estimate.get('estimate_dau', -1)
            return mau, dau
        else:
            error_msg = data.get('error', {}).get('message', 'Unbekannter Fehler')
            print(f"❌ API Fehler bei {country_code}: {error_msg}")
            if "Session has expired" in error_msg:
                print("🚨 CRITICAL: Token ist abgelaufen! Skript wird gestoppt.")
                exit(1)
            return None, None

    except Exception as e:
        print(f"❌ Exception bei Request: {e}")
        return None, None

# --- HAUPTPROGRAMM ---

def run_missing_script():
    print("🚀 Starte Reparatur-Skript (OHNE US)...")
    
    missing_tasks = [
        # Format: (Land, Gender-ID, Gender-Label, Min-Alter, Max-Alter)
        ("CY", 1, "Male", 25, 34),
        ("CZ", 2, "Female", 45, 54),
        ("LV", 1, "Male", 18, 24),
        ("SK", 2, "Female", 65, 65),
        ("SI", 1, "Male", 18, 24),
        ("SI", 2, "Female", 18, 24),
        ("SI", 1, "Male", 25, 34),
        ("SI", 2, "Female", 25, 34),
        ("SI", 1, "Male", 35, 44),
        ("SI", 2, "Female", 35, 44),
        ("SI", 1, "Male", 45, 54),
        ("SI", 2, "Female", 45, 54),
        ("SI", 1, "Male", 55, 64),
    ]

    for country, gender_id, gender_label, age_min, age_max in missing_tasks:
        # Alters-Label korrigieren (z.B. 65-65 zu 65+)
        age_label = f"{age_min}-{age_max}"
        if age_min == 65 and age_max == 65:
            age_label = "65+"

        print(f"Prüfe {country} | {gender_label} | {age_label}...", end="", flush=True)
        
        mau, dau = get_delivery_estimate(country, age_min, age_max, gender_id)
        
        if dau is not None and dau > 0:
            # 1. CPR Berechnen (Wichtig für den Score!)
            # Formel: (100 / Daily Reach) * 1000 Impressions (Cost per 1000 Reach für 100€ Budget Simulation)
            # Da Budget 10000 Cent (100€) ist:
            cpr = (100 / dau) * 1000
            
            # 2. Daten vorbereiten
            data = {
                'country': country,
                'category': 'General',
                'age_group': age_label,
                'gender': gender_label,
                'cpr_value': round(cpr, 2),
                'estimated_reach_for_100': dau,
                'updated_at': 'now()'
            }

            # 3. In Supabase speichern (UPSERT)
            try:
                supabase.table('benchmark_cpr_cache').upsert(
                    data, 
                    on_conflict='country,age_group,gender,category'
                ).execute()
                print(f" -> ✅ Gespeichert! (DAU={dau}, CPR={cpr:.2f})")
            except Exception as e:
                print(f" -> ❌ DB Error: {e}")

        else:
            print(f" -> ⚠️ Keine Daten oder 0 Reach")
        
        # Respektiere das Rate-Limit
        time.sleep(1.0) 

    print("\n🏁 Fertig.")

if __name__ == "__main__":
    try:
        run_missing_script()
    except KeyboardInterrupt:
        print("\nSkript durch Benutzer abgebrochen.")