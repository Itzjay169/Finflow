import time
from typing import Any

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import DEV_JWT_SECRET, ENVIRONMENT, SUPABASE_JWT_SECRET, SUPABASE_URL

# Auto-error False allows us to return custom, structured 401 JSON responses
security = HTTPBearer(auto_error=False)

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"
DEMO_TOKEN = "finflow_demo_jwt_token_2026"
ALLOWED_ALGORITHMS = ["HS256"]


def _unauthorized(message: str, code: str = "UNAUTHORIZED") -> HTTPException:
    """Helper to return consistent structured 401 error."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": code,
            "message": message,
        },
        headers={"WWW-Authenticate": "Bearer"},
    )


def create_local_jwt(user_id: str, email: str, full_name: str | None = None, role: str = "authenticated") -> str:
    """
    Creates a signed JWT for local offline development.
    Strictly forbidden in production environments.
    """
    if ENVIRONMENT not in ("development", "demo", "test"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Offline token issuance is forbidden in production environments.",
        )

    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iss": "finflow-dev",
        "aud": "authenticated",
        "iat": now,
        "exp": now + (86400 * 7),  # 7 days
        "user_metadata": {"full_name": full_name or email.split("@")[0]},
    }
    return jwt.encode(payload, DEV_JWT_SECRET, algorithm="HS256")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> dict[str, Any]:
    """
    Validates incoming JWT bearer tokens with cryptographic signature,
    expiration, and environment guardrails.
    Returns dictionary with authenticated user payload: id, email, role, is_demo.
    """
    if not credentials or not credentials.credentials:
        raise _unauthorized(
            "Authentication token is required. Please supply a valid 'Authorization: Bearer <token>' header."
        )

    token = credentials.credentials.strip()

    # 1. Insecure token shortcuts are strictly rejected
    lowered = token.lower()
    if (
        lowered.startswith("user_")
        or lowered.startswith("test_user_")
        or lowered.startswith("local_user_")
        or lowered.startswith("local_token_")
    ):
        raise _unauthorized(
            "Plaintext token shortcuts are not permitted. A cryptographically signed JWT is required.",
            code="INVALID_TOKEN_FORMAT",
        )

    # 2. Demo mode check
    if token in (DEMO_TOKEN, "demo-token"):
        if ENVIRONMENT not in ("development", "demo", "test"):
            raise _unauthorized(
                "Demo token authentication is disabled in production environments.",
                code="DEMO_MODE_DISABLED",
            )
        return {
            "id": DEMO_USER_ID,
            "email": "demo@finflow.app",
            "role": "authenticated",
            "is_demo": True,
        }

    # 3. Live Supabase JWT verification
    if SUPABASE_JWT_SECRET:
        try:
            decode_options = {
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": False,  # Supabase aud is often 'authenticated'
            }
            issuer = f"{SUPABASE_URL.rstrip('/')}/auth/v1" if SUPABASE_URL else None
            if issuer:
                decode_options["verify_iss"] = False  # Soft verify to accommodate various Supabase gateway configs

            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=ALLOWED_ALGORITHMS,
                options=decode_options,
            )

            user_id = payload.get("sub")
            if not user_id:
                raise _unauthorized("Token payload does not contain subject claim ('sub').", code="INVALID_CLAIMS")

            return {
                "id": str(user_id),
                "email": payload.get("email", ""),
                "role": payload.get("role", "authenticated"),
                "is_demo": False,
            }
        except jwt.ExpiredSignatureError as exc:
            raise _unauthorized("Authentication token has expired. Please refresh your session.", code="TOKEN_EXPIRED") from exc
        except jwt.PyJWTError as exc:
            # If in development, fall through to dev secret verification
            if ENVIRONMENT not in ("development", "demo", "test"):
                raise _unauthorized(f"Cryptographic verification failed: {str(exc)}", code="INVALID_SIGNATURE") from exc

    # 4. Offline Development JWT verification (dev/demo only)
    if ENVIRONMENT in ("development", "demo", "test"):
        try:
            payload = jwt.decode(
                token,
                DEV_JWT_SECRET,
                algorithms=ALLOWED_ALGORITHMS,
                options={"verify_signature": True, "verify_exp": True, "verify_aud": False},
            )
            user_id = payload.get("sub")
            if not user_id:
                raise _unauthorized("Dev token does not contain a subject identifier.", code="INVALID_CLAIMS")

            return {
                "id": str(user_id),
                "email": payload.get("email", ""),
                "role": payload.get("role", "authenticated"),
                "is_demo": False,
            }
        except jwt.ExpiredSignatureError as exc:
            raise _unauthorized("Development session has expired. Please sign in again.", code="TOKEN_EXPIRED") from exc
        except jwt.PyJWTError as exc:
            raise _unauthorized(f"Invalid development token: {str(exc)}", code="INVALID_TOKEN") from exc

    # 5. Production fallback failure
    raise _unauthorized(
        "Authentication failed. No valid Supabase JWT secret configured on the server.",
        code="AUTH_MISCONFIGURED",
    )
