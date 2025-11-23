import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import aus "app.routers"
from app.routers import search
from app.core.config import settings

app = FastAPI(title="Ad Spy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hier binden wir den Router ein
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])

@app.get("/")
def root():
    return {"message": "API is running"}

if __name__ == "__main__":
    # Da main.py jetzt im Root liegt, starten wir einfach "main:app"
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)