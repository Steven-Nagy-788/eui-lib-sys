from functools import lru_cache
from supabase import create_client, Client
from pydantic_settings import BaseSettings
from pathlib import Path

# Get the absolute path to the .env file in the same directory as this config.py
env_path = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_EXPIRATION_MINUTES: int

    class Config:
        env_file = str(env_path)
        env_file_encoding = "utf-8"


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
            _supabase_client = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_KEY
            )
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Supabase client: {str(e)}")

    return _supabase_client
