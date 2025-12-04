# 🚀 Ad Spy API & Minimal Frontend

[cite_start]Dieses Repository enthält den Kern unseres **Ad Spy Tools**, einer SaaS-Lösung, die E-Commerce-Unternehmern ermöglicht, **aktuelle (LIVE) und virale Anzeigen** von Meta (Facebook/Instagram) und TikTok zu identifizieren[cite: 88, 117].

[cite_start]Wir konkurrieren nicht über die Datenbankgröße, sondern über die **Aktualität der Daten** und ein **faires Credit-Modell** (1 Credit = 1 Full Result)[cite: 88, 107].

## 1. 🎯 Projekt-Highlights & Strategie

* [cite_start]**Strategischer Fokus:** Konzentration auf "Aktualität" (Live Data) statt auf Datenbankgröße ("cold data")[cite: 88].
* [cite_start]**Wettbewerbsvorteil (Caching):** Unser Supabase-Caching-Modell ist **800x günstiger** als der reine API-Abruf[cite: 125]. [cite_start]Der Profit wird durch den Cache-Hit nach dem ersten teuren API-Aufruf generiert[cite: 127].
* [cite_start]**Monetarisierung (Hard Currency):** Wir verwenden ein "Hard Currency" Modell, bei dem **1 Credit = 1 Full Result** entspricht[cite: 107].
* [cite_start]**MVP-Ziel:** Launch eines funktionalen MVP schnellstmöglich ("Solo MVP"), wobei eine synchrone Wartezeit von 1-2 Minuten akzeptabel ist[cite: 40, 44].

---

## 2. ⚙️ Technischer Stack (Phase 1: MVP)

| Komponente | Technologie | Zweck | Quelle |
| :--- | :--- | :--- | :--- |
| **Backend Core** | FastAPI (Python) | [cite_start]High-Performance API und Routing[cite: 131]. [cite_start]| [cite: 131] |
| **Database/Auth** | Supabase (PostgreSQL) | [cite_start]Speicherung von Benutzerprofilen, Credits und dem 24h-Cache[cite: 65, 120, 160]. [cite_start]| [cite: 132] |
| **Frontend** | Next.js & Tremor | [cite_start]Minimales UI für Login, Dashboard und Search-Ergebnisse[cite: 43, 70]. [cite_start]| [cite: 43, 70] |
| **Meta Scraper** | Apify Client (Curious Coder: `XtaWFhbtfxyzqrFmd`) | [cite_start]Ruft Meta Ads via **URL Construction Logic** ab[cite: 6, 7, 10]. [cite_start]| [cite: 6, 7, 10] |
| **TikTok Scraper** | Apify Client (Clockworks: `clockworks/tiktok-trends-scraper`) | [cite_start]Ruft virale TikTok-Videos via **Trends Strategie / Hashtag Search** ab[cite: 18, 19, 22]. [cite_start]| [cite: 18, 19, 22] |

---

## 3. 🚀 Entwicklung & Start-Anleitung

### 3.1. Backend Setup

1.  **Repository Klonen**
    ```bash
    git clone [REPO URL]
    cd [REPO NAME]/backend
    ```
2.  **Abhängigkeiten installieren**
    [cite_start]Die benötigten Pakete sind in `requirements.txt` gelistet[cite: 137, 172].
    ```bash
    pip install -r requirements.txt
    ```
3.  **Konfiguration (`.env`)**
    Erstellen Sie die Datei `backend/.env` (NICHT committen!) [cite: 140] mit Ihren Zugangsdaten:
    ```ini
    APIFY_TOKEN=your_apify_token_here
    SUPABASE_URL=your_supabase_url_here
    SUPABASE_KEY=your_supabase_anon_key_here
    ```
4.  **Server starten**
    ```bash
    uvicorn main:app --reload
    ```
    Der API-Server läuft nun unter `http://127.0.0.1:8000/docs`[cite: 178].

### 3.2. Frontend Setup (Minimal Frontend)

* [cite_start]**Goal:** Next.js Projekt im Root-Verzeichnis (`apify_saas/`) erstellen und UI mit Tremor-Komponenten aufbauen[cite: 43, 70].
* **Aktion:** Führen Sie diesen Befehl aus, um das `frontend`-Verzeichnis zu erstellen:

```bash
# Stellen Sie sicher, dass Sie sich im Root-Verzeichnis befinden
npx create-next-app@latest frontend