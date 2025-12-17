import os
import time
from pathlib import Path
from dotenv import load_dotenv
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.exceptions import FacebookRequestError
from supabase import create_client, Client

# --- 1. SICHERES LADEN DER .ENV DATEI ---
# Wir suchen die .env Datei im selben Ordner, in dem dieses Skript liegt
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# --- 2. VARIABLEN AUS UMGEBUNG LADEN ---
FB_ACCESS_TOKEN = os.getenv("FB_ACCESS_TOKEN")
# Falls in der .env nur die Nummer steht, fügen wir 'act_' hinzu, falls es fehlt
_ad_account_id_raw = os.getenv("FB_AD_ACCOUNT_ID", "")
FB_AD_ACCOUNT_ID = _ad_account_id_raw if _ad_account_id_raw.startswith("act_") else f"act_{_ad_account_id_raw}"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Sicherheits-Check: Abbrechen, wenn Daten fehlen
if not FB_ACCESS_TOKEN or not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ FEHLER: Zugangsdaten fehlen in backend/.env!")
    print(f"Gefundener Token: {'Ja' if FB_ACCESS_TOKEN else 'Nein'}")
    print(f"Gefundene Account ID: {'Ja' if _ad_account_id_raw else 'Nein'}")
    exit(1)

# --- DEFINITIONEN ---
COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 
    'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 
    'CH', 'GB'
]

AGE_BUCKETS = [
    {'min': 18, 'max': 24, 'label': '18-24'},
    {'min': 25, 'max': 34, 'label': '25-34'},
    {'min': 35, 'max': 44, 'label': '35-44'},
    {'min': 45, 'max': 54, 'label': '45-54'},
    {'min': 55, 'max': 64, 'label': '55-64'},
    {'min': 65, 'max': 65, 'label': '65+'}
]

GENDERS = [{'id': 1, 'label': 'Male'}, {'id': 2, 'label': 'Female'}]
CATEGORIES = [{'name': 'General', 'interests': []}]

# --- INIT ---
try:
    FacebookAdsApi.init(access_token=FB_ACCESS_TOKEN)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Init erfolgreich")
    # Debug Ausgabe (ohne den ganzen Key zu zeigen)
    print(f"🔒 Nutze Account ID: {FB_AD_ACCOUNT_ID}")
except Exception as e:
    print(f"❌ Fehler beim Init: {e}")
    exit(1)

def check_if_exists(country, age_group, gender, category):
    try:
        response = supabase.table('benchmark_cpr_cache') \
            .select('id') \
            .eq('country', country) \
            .eq('age_group', age_group) \
            .eq('gender', gender) \
            .eq('category', category) \
            .execute()
        return len(response.data) > 0
    except:
        return False

def get_meta_reach_estimate_safe(account_id, country_code, age_min, age_max, gender_id):
    account = AdAccount(account_id)
    params = {
        'optimization_goal': 'REACH',
        'targeting_spec': {
            'geo_locations': {'countries': [country_code]},
            'age_min': age_min, 'age_max': age_max,
            'genders': [gender_id],
            'publisher_platforms': ['facebook', 'instagram'],
        },
        'daily_budget': 10000,
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            estimates = account.get_delivery_estimate(params=params)
            if estimates and len(estimates) > 0:
                data = estimates[0]
                reach = data.get('estimate_dau', 0)
                if reach == 0 and 'daily_outcomes_curve' in data:
                    curve = data['daily_outcomes_curve']
                    if len(curve) > 0: reach = curve[-1].get('reach', 0)
                return reach
            return 0
        except FacebookRequestError as e:
            if e.api_error_code() in [17, 4, 80004, 613]:
                wait_time = 60 * (attempt + 1)
                print(f"\n✋ Rate Limit (Code {e.api_error_code()}). Pause für {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                print(f"\n❌ API Fehler bei {country_code}: {e}")
                return 0
        except Exception:
            return 0
    return 0

def update_benchmarks():
    print(f"🚀 Starte Smart-Benchmark Scan (OHNE US)...")
    
    total_steps = len(COUNTRIES) * len(AGE_BUCKETS) * len(GENDERS) * len(CATEGORIES)
    current_step = 0
    skipped_count = 0

    for country in COUNTRIES:
        for age in AGE_BUCKETS:
            for gender in GENDERS:
                for cat in CATEGORIES:
                    current_step += 1
                    label = f"{country} | {gender['label']} | {age['label']}"
                    
                    # SMART CHECK
                    if check_if_exists(country, age['label'], gender['label'], cat['name']):
                        print(f"[{current_step}/{total_steps}] {label} -> ✅ Vorhanden (Skip)")
                        skipped_count += 1
                        continue

                    # API CALL
                    print(f"[{current_step}/{total_steps}] Prüfe {label}...", end="", flush=True)
                    reach = get_meta_reach_estimate_safe(
                        FB_AD_ACCOUNT_ID, country, age['min'], age['max'], gender['id']
                    )
                    
                    if reach > 0:
                        cpr = (100 / reach) * 1000
                        print(f" -> CPR: {cpr:.2f}€")
                        
                        data = {
                            'country': country,
                            'category': cat['name'],
                            'age_group': age['label'],
                            'gender': gender['label'],
                            'cpr_value': round(cpr, 2),
                            'estimated_reach_for_100': reach,
                            'updated_at': 'now()'
                        }
                        try:
                            supabase.table('benchmark_cpr_cache').upsert(data, on_conflict='country,age_group,gender,category').execute()
                        except Exception as e:
                            print(f" (DB Error: {e})")
                    else:
                        print(" -> Keine Daten")
                    
                    time.sleep(1.0) 

    print(f"\n✅ Fertig! {skipped_count} übersprungen, {total_steps - skipped_count} neu geladen.")

if __name__ == "__main__":
    update_benchmarks()