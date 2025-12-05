from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, user, search

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- HIER IST DER FIX ---
# Wir erlauben Vercel den Zugriff auf das Backend
origins = [
    "http://localhost:5173",          # Lokale Entwicklung
    "http://127.0.0.1:5173",          # Lokale Entwicklung (Alternative)
    "https://apify-saas.vercel.app",  # <--- DEINE VERCEL DOMAIN (Wichtig!)
    "*"                               # (Optional: Erlaubt alles, gut zum Testen)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "active", "message": "Ad Spy API is running"}

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])