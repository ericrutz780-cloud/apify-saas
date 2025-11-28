graph TD
    A[POST /api/v1/search/] --> B(1. Validierung);
    B --> C{2. Cache-Prüfung?};

    C -- HIT --> D[Daten aus Cache];
    D --> J(ENDE: Response);

    C -- MISS --> E(3. Live API Call);

    E --> F{Routing};
    
    F -- meta --> G1(apify_meta.py);
    F -- tiktok --> G2(apify_tiktok.py);

    G1 --> H(Ergebnisse empfangen);
    G2 --> H;

    H --> I(4. Speicherung & Caching);
    
    I --> K[DB Write: ad_results];
    
    K --> L(ENDE: Response);
