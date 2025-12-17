from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, user, search

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- CORS KONFIGURATION (FIX) ---
# Wichtig: Bei allow_credentials=True darf "*" oft nicht verwendet werden.
# Wir müssen die exakten Domains auflisten.
origins = [
    "http://localhost:5173",          # Lokale Entwicklung
    "http://127.0.0.1:5173",          # Lokale Entwicklung Alternative
    "https://apify-saas.vercel.app",  # Haupt-Domain
    # Hier ist die Domain aus deiner Fehlermeldung:
    "https://apify-saas-pnvaal3o4-ericrutz780-clouds-projects.vercel.app" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,    # Exakte Liste statt "*"
    allow_credentials=True,   # Erlaubt Cookies/Auth-Header
    allow_methods=["*"],      # Erlaubt alle Methoden (GET, POST, etc.)
    allow_headers=["*"],      # Erlaubt alle Header
)

@app.get("/")
def root():
    return {"status": "active", "message": "Ad Spy API is running"}

# Router einbinden
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])