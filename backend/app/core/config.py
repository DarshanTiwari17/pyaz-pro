import os

class Settings:
    PROJECT_NAME: str = "PYAAZ-PRO Backend"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pyaaz-pro-super-secret-production-grade-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./pyaaz_pro.db")
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./storage")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./storage/uploads")
    REPORT_DIR: str = os.getenv("REPORT_DIR", "./storage/reports")
    DATASET_DIR: str = os.getenv("DATASET_DIR", "./storage/datasets")

settings = Settings()

# Ensure required directories exist
for path in [settings.STORAGE_DIR, settings.UPLOAD_DIR, settings.REPORT_DIR, settings.DATASET_DIR]:
    os.makedirs(path, exist_ok=True)
