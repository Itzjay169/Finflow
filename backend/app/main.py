from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sentry_sdk
from .config import CORS_ORIGINS, ENVIRONMENT, SENTRY_DSN, MODEL_PATH

# Optional Sentry initialization
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
        environment=ENVIRONMENT,
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print(f"[FinFlow] Backend starting in {ENVIRONMENT} mode...")
    print(f"[FinFlow] Model path configured at: {MODEL_PATH}")
    yield
    print("[FinFlow] Backend shutting down cleanly...")

app = FastAPI(
    title="FinFlow API – Personal Finance Tracker",
    description="High-velocity personal finance tracking, analytics, and ML classification engine.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS if origin.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "app": "FinFlow API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "finflow-backend",
        "environment": ENVIRONMENT,
        "model_available": MODEL_PATH.exists(),
    }
