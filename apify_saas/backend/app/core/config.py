import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # --- Bestehende Pflichtfelder (Unverändert) ---
    APIFY_TOKEN: str
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # --- Optionale Konfigurationen (Unverändert) ---
    PROJECT_NAME: str = "Ad Spy API"
    API_V1_STR: str = "/api/v1"

    # --- NEU HINZUGEFÜGT (Damit der Server nicht abstürzt) ---
    # Diese Variablen hast du in der .env Datei, deshalb müssen sie hier definiert sein.
    STRIPE_API_KEY: str | None = None
    FB_ACCESS_TOKEN: str | None = None
    FB_AD_ACCOUNT_ID: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        # WICHTIG: Das verhindert den Absturz bei unbekannten Variablen in .env
        extra = "ignore"

settings = Settings()