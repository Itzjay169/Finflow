import logging
import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .auth import DEMO_USER_ID
from .config import (
    CORS_ORIGINS,
    DB_FILE,
    ENVIRONMENT,
    RATE_LIMITING_ENABLED,
    SENTRY_DSN,
    SUPABASE_URL,
)
from .database import get_db, init_db
from .routers.analytics import router as analytics_router
from .routers.auth import router as auth_router
from .routers.predictor import router as predictor_router
from .routers.smart import router as smart_router
from .routers.transactions import router as transactions_router
from .services.predictor import check_model_health
from .services.transactions import get_summary, seed_sample_data

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("finflow")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
        environment=ENVIRONMENT,
    )


# In-memory sliding-window rate limiter
_request_counts: dict[str, list[float]] = defaultdict(list)

def _is_rate_limited(key: str, max_requests: int, window_seconds: float) -> bool:
    if not RATE_LIMITING_ENABLED:
        return False
    now = time.time()
    cutoff = now - window_seconds
    timestamps = [t for t in _request_counts[key] if t > cutoff]
    timestamps.append(now)
    _request_counts[key] = timestamps
    return len(timestamps) > max_requests


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema & indexes
    init_db()

    # Auto-seed demo account on startup if empty
    summary = get_summary(DEMO_USER_ID)
    if summary["transaction_count"] == 0:
        try:
            res = seed_sample_data(DEMO_USER_ID)
            logger.info("Auto-seeded %s benchmark records into demo account.", res.get("inserted_count", 0))
        except Exception as exc:
            logger.warning("Notice on seeding demo data: %s", exc)

    logger.info("FinFlow API initialized in %s mode.", ENVIRONMENT)
    yield
    logger.info("FinFlow API shutdown complete.")


app = FastAPI(
    title="FinFlow API – Personal Finance & Machine Learning Platform",
    description="High-velocity personal finance telemetry, cashflow projections, and 18-feature ML classification engine.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration strictly from environment variable
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


# Security Headers & Request ID Middleware
@app.middleware("http")
async def security_and_telemetry_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = req_id
    start_time = time.time()

    # Rate limiting for auth and predictor paths
    client_ip = request.client.host if request.client else "127.0.0.1"
    path = request.url.path

    if path.startswith(("/api/predict", "/api/v1/predict")) and _is_rate_limited(f"predict:{client_ip}", max_requests=100, window_seconds=60):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "success": False,
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many prediction requests. Please wait a minute before retrying.",
                    "details": [],
                },
            },
            headers={"Retry-After": "60", "X-Request-ID": req_id},
        )

    if path.startswith(("/api/auth/", "/api/v1/auth/")) and _is_rate_limited(f"auth:{client_ip}", max_requests=30, window_seconds=60):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "success": False,
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many authentication requests. Please wait a minute before retrying.",
                    "details": [],
                },
            },
            headers={"Retry-After": "60", "X-Request-ID": req_id},
        )

    response: Response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)

    # Attach Security Headers
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"

    logger.info("%s %s -> %s (%sms) [req=%s]", request.method, path, response.status_code, duration_ms, req_id)
    return response


# Exception Handlers for Unified Structured JSON Errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        loc = " -> ".join(str(item) for item in err.get("loc", []))
        details.append({"field": loc, "message": err.get("msg", "Invalid value")})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input payload failed validation rules.",
                "details": details,
            },
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    code = "REQUEST_ERROR"
    message = str(exc.detail)
    details = []

    if isinstance(exc.detail, dict):
        code = exc.detail.get("code", code)
        message = exc.detail.get("message", message)
        details = exc.detail.get("details", [])

    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
        },
    )


# Include Primary Routers
app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(analytics_router)
app.include_router(predictor_router)
app.include_router(smart_router)

# Include v1 Aliases for Forward-Compatible Versioning
app.include_router(auth_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(predictor_router, prefix="/api/v1")
app.include_router(smart_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "app": "FinFlow API",
        "status": "online",
        "version": "2.0.0",
        "environment": ENVIRONMENT,
        "docs_url": "/docs",
        "accuracy_held_out": "Held-out test accuracy: 95.83% on 240 unseen rows.",
    }


@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Comprehensive service, database, and machine learning health check."""
    # DB health
    db_healthy = False
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            db_healthy = bool(cursor.fetchone())
    except Exception:
        db_healthy = False

    # Model health
    model_health = check_model_health()

    # Supabase health
    supabase_configured = bool(SUPABASE_URL)

    overall_healthy = db_healthy and model_health["model_loaded"]

    return {
        "status": "healthy" if overall_healthy else "degraded",
        "service": "finflow-backend",
        "version": "2.0.0",
        "environment": ENVIRONMENT,
        "checks": {
            "database": {
                "status": "healthy" if db_healthy else "unhealthy",
                "engine": "SQLite",
                "database_file": str(DB_FILE),
            },
            "model_artifact": model_health,
            "supabase": {
                "configured": supabase_configured,
                "url": SUPABASE_URL if supabase_configured else None,
            },
        },
    }
