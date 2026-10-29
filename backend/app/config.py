import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "Food Verse AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Environment & Host
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security & CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    USDA_API_KEY: str = os.getenv("USDA_API_KEY", "DEMO_KEY")
    
    # Storage
    DB_PATH: Path = BASE_DIR / "food_verse.db"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
