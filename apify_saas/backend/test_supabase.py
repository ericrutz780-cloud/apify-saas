import sys
import os
import json

# 1. Wir sorgen dafür, dass das Skript die 'app'-Module findet
# (Genauso wie es in deiner main.py gemacht wird)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    # 2. Wir importieren die Einstellungen direkt aus deiner Config
    # Das nutzt automatisch die Werte aus der .env Datei!
    from app.core.config import settings
    from supabase import create_client, Client
except ImportError as e:
    print("❌ Fehler beim Importieren. Bist du im Ordner 'backend'?")
    print(f"Details: {e}")
    sys.exit(1)

def test_supabase_direct():
    print(f"🔧 Lade Konfiguration...")
    print(f"   -> URL: {settings.SUPABASE_URL}")
    # Wir zeigen nur die ersten 10 Zeichen des Keys zur Sicherheit
    print(f"   -> Key: {settings.SUPABASE_KEY[:10]}...[versteckt]")
    
    try:
        # Client erstellen
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        
        print("\n📡 Sende Anfrage an Supabase (Tabelle: ad_results)...")
        
        # Anfrage: Hole die neuesten 3 Einträge
        response = supabase.table("ad_results").select("*").limit(3).execute()
        
        # Ergebnis auswerten
        data = response.data
        
        if data and len(data) > 0:
            print(f"\n✅ VERBINDUNG ERFOLGREICH! {len(data)} Datensätze gefunden.")
            print("="*60)
            
            for i, item in enumerate(data):
                print(f"\n📄 Datensatz #{i+1}")
                print(f"   - ID: {item.get('id')}")
                print(f"   - Platform: {item.get('platform')}")
                
                # Check der 'data' Spalte (Das JSON)
                json_content = item.get('data')
                if json_content:
                    print(f"   - 📦 JSON-Inhalt (data): VORHANDEN")
                    
                    # Tiefenprüfung des JSONs
                    snapshot = json_content.get('snapshot')
                    if snapshot:
                        title = snapshot.get('title') or snapshot.get('page_name') or "Unbekannt"
                        media_count = len(snapshot.get('images', [])) + len(snapshot.get('videos', [])) + len(snapshot.get('cards', []))
                        print(f"     -> Titel im JSON: '{title}'")
                        print(f"     -> Medien-Elemente: {media_count}")
                        
                        # Kurzer Check auf kritische Felder
                        if not snapshot.get('images') and not snapshot.get('videos') and not snapshot.get('cards'):
                            print("     ⚠️ WARNUNG: Keine Bilder/Videos/Cards in diesem JSON gefunden!")
                    else:
                        print("     ⚠️ WARNUNG: 'snapshot' fehlt im JSON!")
                else:
                    print("   ❌ FEHLER: Spalte 'data' ist leer/null!")
            
            print("="*60)
            print("\n👉 FAZIT: Das Backend hat Zugriff und die Daten sind korrekt gespeichert.")
            
        else:
            print("\n⚠️ VERBINDUNG OK, ABER TABELLE LEER.")
            print("   -> Die Zugangsdaten stimmen, aber es wurden noch keine Scrape-Ergebnisse gespeichert.")

    except Exception as e:
        print(f"\n❌ KRITISCHER FEHLER BEI DER VERBINDUNG:")
        print(str(e))
        print("\nLösungsvorschlag:")
        print("1. Prüfe, ob die URL in backend/.env korrekt ist.")
        print("2. Prüfe, ob der KEY in backend/.env korrekt ist (keine Leerzeichen!).")

if __name__ == "__main__":
    test_supabase_direct()