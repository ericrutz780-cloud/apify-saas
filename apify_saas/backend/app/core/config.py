import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Definiert, welche Variablen in der .env Datei sein MÜSSEN
    APIFY_TOKEN: str
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Optionale Konfigurationen
    PROJECT_NAME: str = "Ad Spy API"
    API_V1_STR: str = "/api/v1"

    class Config:
        # Der Pfad zur .env Datei (liegt im backend/ Ordner)
        env_file = ".env"
        case_sensitive = True

settings = Settings()