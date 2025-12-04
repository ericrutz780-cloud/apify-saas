# Datei: backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, user, search

# Hier wird die 'app' Variable definiert, die dein Server sucht!
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS erlaubt dem Frontend (Port 5173) den Zugriff
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"  # Nur für Entwicklung
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

# Hier werden deine Endpunkte verknüpft
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
