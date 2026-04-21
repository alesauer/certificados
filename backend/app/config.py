import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB
