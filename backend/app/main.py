from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sentry_sdk
from .config import CORS_ORIGINS, ENVIRONMENT, SENTRY_DSN, MODEL_PATH
from .database import init_db
from .services.transactions import seed_sample_data, get_summary
from .auth import DEMO_USER_ID
from .routers.transactions import router as transactions_router
from .routers.analytics import router as analytics_router

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
        environment=ENVIRONMENT,
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Auto-seed demo account if needed
    summary = get_summary(DEMO_USER_ID)
    if summary["transaction_count"] == 0:
        try:
            seeded = seed_sample_data(DEMO_USER_ID)
            print(f"[FinFlow] Auto-seeded {seeded} benchmark records into demo account!")
        except Exception as e:
            print(f"[FinFlow] Notice on seeding demo data: {e}")

    print(f"[FinFlow] Backend active in {ENVIRONMENT} mode.")
    yield
    print("[FinFlow] Backend shutdown complete.")

app = FastAPI(
    title="FinFlow API – Personal Finance Tracker",
    description="High-velocity personal finance tracking, analytics, and ML classification engine.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS if origin.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(transactions_router)
app.include_router(analytics_router)

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
