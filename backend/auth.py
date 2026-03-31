"""
Cognito JWT authentication middleware.

Verifies the Bearer token from the Authorization header against the
Cognito User Pool's JWKS (JSON Web Key Set).
"""
import time
import httpx
from jose import jwt, JWTError, jwk
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour

security = HTTPBearer()


# ── M2M: JWT Token Generator for fly.dev AI Service ──────────────────────────
def generate_ai_token() -> str:
    """
    Creates a short-lived HS256 JWT to authenticate M2M calls to the AI service.
    The AI server (fly.dev) must be configured with the same SECRET_KEY.
    Returns an empty string if AI_SERVICE_SECRET_KEY is not configured.
    """
    secret = settings.AI_SERVICE_SECRET_KEY
    if not secret:
        return ""
    payload = {
        "service": "backend",
        "exp": int(time.time()) + 3600,  # expires in 1 hour
    }
    return jwt.encode(payload, secret, algorithm="HS256")
# ─────────────────────────────────────────────────────────────────────────────

async def _get_jwks() -> dict:
    """Fetch and cache Cognito JWKS."""
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and (time.time() - _jwks_fetched_at < JWKS_CACHE_TTL):
        return _jwks_cache

    jwks_url = (
        f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com"
        f"/{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = time.time()
        return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency that extracts and verifies the Cognito JWT token.
    Returns the decoded token claims (sub, email, etc.).
    """
    token = credentials.credentials

    try:
        jwks = await _get_jwks()

        # Get the kid from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key
        rsa_key = None
        for key in jwks.get("keys", []):
            if key["kid"] == kid:
                rsa_key = key
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Token key not found")

        # Verify and decode
        issuer = (
            f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com"
            f"/{settings.COGNITO_USER_POOL_ID}"
        )

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=settings.COGNITO_APP_CLIENT_ID,
            issuer=issuer,
        )

        return {
            "userId": payload["sub"],
            "email": payload.get("email", ""),
            "name": payload.get("name", payload.get("email", "")),
        }

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Auth service unavailable")
