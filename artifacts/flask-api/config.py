import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SESSION_SECRET", "dev-secret-change-in-prod")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///india_live.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///india_live.db")
    _is_postgres = _db_url.startswith("postgres")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        **({"pool_timeout": 30, "pool_size": 5, "max_overflow": 10,
            "connect_args": {"connect_timeout": 10}} if _is_postgres else {}),
    }

    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

    MAX_CONTENT_LENGTH = 500 * 1024 * 1024

    PERMANENT_SESSION_LIFETIME = timedelta(days=30)
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
