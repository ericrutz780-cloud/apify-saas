import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, search, user
from app.core.config import settings

app = FastAPI(title="AdSpy API")

# CORS Setup - Wichtig für Frontend Zugriff
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Erlaubt alle Origins (für Dev ok)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1/user", tags=["User"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)