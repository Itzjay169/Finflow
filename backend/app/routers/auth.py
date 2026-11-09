import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import DEMO_TOKEN, DEMO_USER_ID, create_local_jwt, get_current_user
from ..config import ENVIRONMENT
from ..database import get_db
from ..models import LocalAuthRequest, LocalAuthResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/offline-session", response_model=LocalAuthResponse)
async def create_offline_session(payload: LocalAuthRequest):
    """
    Issues a valid cryptographically signed development JWT for offline development and testing.
    Strictly disabled when ENVIRONMENT is production.
    """
    if ENVIRONMENT not in ("development", "demo", "test"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Offline local authentication is disabled in production environments.",
        )

    email = payload.email.strip().lower()
    full_name = (payload.full_name or email.split("@")[0]).strip()

    # Deterministic or new user ID
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"finflow.local:{email}"))

    # Ensure profile and default preferences exist in SQLite database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO profiles (id, email, full_name, currency, theme_preference, accent_color)
            VALUES (?, ?, ?, 'INR', 'dark', 'indigo')
            ON CONFLICT(id) DO UPDATE SET full_name = excluded.full_name
            """,
            (user_id, email, full_name),
        )
        cursor.execute(
            """
            INSERT OR IGNORE INTO user_preferences (user_id)
            VALUES (?)
            """,
            (user_id,),
        )

    token = create_local_jwt(user_id=user_id, email=email, full_name=full_name)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "user_metadata": {
                "full_name": full_name,
                "avatar_url": None,
            },
        },
    }


@router.post("/demo-session", response_model=LocalAuthResponse)
async def create_demo_session():
    """Returns credentials for the canonical benchmark demo account in development mode."""
    if ENVIRONMENT not in ("development", "demo", "test"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo session endpoint is disabled in production environments.",
        )

    return {
        "access_token": DEMO_TOKEN,
        "token_type": "bearer",
        "user": {
            "id": DEMO_USER_ID,
            "email": "demo@finflow.app",
            "user_metadata": {
                "full_name": "Alex Mercer",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            },
        },
    }


@router.get("/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """Returns authenticated session identity."""
    return user

