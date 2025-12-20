import os
from functools import lru_cache
from supabase import create_client, Client
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env immediately
load_dotenv()

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

# 1. SETTINGS SINGLETON
@lru_cache()
def get_settings():
    return Settings()

# 2. DATABASE CLIENT SINGLETON
# We use a global variable to ensure only one instance exists across the app lifecycle.
_supabase_client: Client | None = None

def get_supabase() -> Client:
    """
    Returns the singleton Supabase client.
    """
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase client: {str(e)}")
            
    return _supabase_client