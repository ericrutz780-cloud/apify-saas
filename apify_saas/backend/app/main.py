from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, user, search, demo

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# --- CORS KONFIGURATION ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://apify-saas.vercel.app",
    "https://app.stellaads.io",  # WICHTIG: Erlaubt deine App-Subdomain
    "https://stellaads.io"       # Erlaubt deine Hauptdomain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Erlaubt alle Vercel Preview URLs dynamisch (z.B. https://apify-saas-git-main.vercel.app)
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
app.include_router(demo.router, prefix="/api/v1/demo", tags=["Demo"])