from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import SUPABASE_JWT_SECRET

security = HTTPBearer(auto_error=False)

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
) -> dict[str, Any]:
    """
    Verifies incoming JWT token from Supabase Auth or demo session.
    Returns user payload dictionary containing 'id' and 'email'.
    """
    if not credentials:
        # Fallback to demo user for ease of local testing if no header is supplied
        return {
            "id": DEMO_USER_ID,
            "email": "demo@finflow.app",
            "role": "authenticated",
            "is_demo": True,
        }

    token = credentials.credentials

    # 1. Check demo / local token
    if token in ("finflow_demo_jwt_token_2026", "demo-token"):
        return {
            "id": DEMO_USER_ID,
            "email": "demo@finflow.app",
            "role": "authenticated",
            "is_demo": True,
        }

    if token.startswith("user_") or token.startswith("test_user_") or token.startswith("local_user_"):
        return {
            "id": token,
            "email": f"{token}@finflow.app",
            "role": "authenticated",
            "is_demo": False,
        }

    # 2. Supabase JWT validation
    try:
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Decode without secret verification in dev mode if secret is not set
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a valid user ID (sub)",
            )

        return {
            "id": user_id,
            "email": payload.get("email", ""),
            "role": payload.get("role", "authenticated"),
            "is_demo": False,
        }

    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(exc)}",
        ) from exc

