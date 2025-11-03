from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


def decode_token(token: str) -> dict:
    """Decodificar y validar el JWT"""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_signature": True, "verify_aud": False}
        )
        return payload
    except JWTError as e:
        logger.error(f"❌ JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Obtener el usuario actual desde el token JWT"""
    token = credentials.credentials
    payload = decode_token(token)

    user_id = payload.get("sub")
    username = payload.get("username")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "user_id": user_id,
        "username": username,
        "roles": payload.get("roles", [])
    }

