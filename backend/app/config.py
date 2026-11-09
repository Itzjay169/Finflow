import os
from pathlib import Path

from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

# Server settings
PORT = int(os.getenv("PORT", 8000))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# CORS: Configured from environment variable only. Defaults to safe localhost development origins if unset.
_default_cors = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_cors).split(",")
    if origin.strip()
]

# Supabase Auth & DB
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()

# Local / Offline Development JWT Secret (strictly prohibited in production)
DEV_JWT_SECRET = os.getenv(
    "DEV_JWT_SECRET", "finflow-offline-dev-secret-only-for-local-demo-do-not-use-in-prod"
)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DB_FILE = Path(os.getenv("SQLITE_DB_PATH", str(BASE_DIR / "backend" / "finflow.db")))

# ML Artifacts
MODEL_PATH = BASE_DIR / os.getenv("MODEL_PATH", "transaction_type_classifier.joblib")
MODEL_METADATA_PATH = BASE_DIR / os.getenv("MODEL_METADATA_PATH", "backend/app/model_metadata.json")
DATASET_PATH = BASE_DIR / os.getenv("DATASET_PATH", "personal_finance_dummy_dataset_1200.csv")

# Sentry Monitoring
SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()

# Rate Limiting
RATE_LIMITING_ENABLED = os.getenv("RATE_LIMITING_ENABLED", "true").lower() in ("true", "1", "yes")
