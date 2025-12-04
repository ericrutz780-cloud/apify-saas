# Datei: backend/main.py

import uvicorn
import os
import sys

# Damit Python den 'app' Ordner findet
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # WICHTIG: Wir verweisen jetzt auf "app.main:app" (Ordner app -> Datei main.py -> Variable app)
    # Vorher stand hier wahrscheinlich nur "main:app", was falsch war.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)