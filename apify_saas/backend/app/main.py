from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
# HIER: 'demo' Router importieren
from app.routers import auth, user, search, demo

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- CORS KONFIGURATION (PERMANENTER FIX) ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://apify-saas.vercel.app", # Deine Haupt-Domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # WICHTIG: Dieser Regex erlaubt ALLE deine Vercel Preview URLs automatisch!
    # Egal welche ID Vercel generiert (z.B. f6yt1svdr oder pnvaal3o4), es wird funktionieren.
    allow_origin_regex=r"https://apify-saas.*\.vercel\.app", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "active", "message": "Ad Spy API is running"}

# Router einbinden
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
# HIER: Demo Router einbinden
app.include_router(demo.router, prefix="/api/v1/demo", tags=["Demo"])