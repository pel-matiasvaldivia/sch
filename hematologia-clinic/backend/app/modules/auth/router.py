"""Router de autenticación: login, refresh, logout."""
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from redis.asyncio import Redis

from app.core.redis_client import get_redis
from app.db.session import get_db
from app.dependencies import get_current_user
from app.modules.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
)
from app.modules.auth.service import AuthService
from app.modules.users.schemas import UserRead

router = APIRouter(prefix="/v1/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
    db=Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """
    Autentica al usuario y retorna access + refresh tokens.

    - Si el usuario tiene 2FA habilitado, se requiere `totp_code`.
    - El access token expira en 15 minutos.
    - El refresh token expira en 7 días y se almacena en Redis.
    """
    service = AuthService(db, redis)
    ip = request.client.host if request.client else "unknown"
    return await service.login(
        email=data.email,
        password=data.password,
        totp_code=data.totp_code,
        ip_address=ip,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshRequest,
    db=Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """
    Genera un nuevo par de tokens usando el refresh token.
    El refresh token anterior es revocado (rotación de tokens).
    """
    service = AuthService(db, redis)
    return await service.refresh(data.refresh_token)


@router.post("/logout", status_code=204)
async def logout(
    data: LogoutRequest,
    db=Depends(get_db),
    redis: Redis = Depends(get_redis),
    current_user=Depends(get_current_user),
):
    """Cierra la sesión actual revocando el refresh token."""
    service = AuthService(db, redis)
    await service.logout(current_user.id, data.refresh_token)


@router.post("/logout-all", status_code=204)
async def logout_all(
    db=Depends(get_db),
    redis: Redis = Depends(get_redis),
    current_user=Depends(get_current_user),
):
    """Cierra todas las sesiones del usuario en todos los dispositivos."""
    service = AuthService(db, redis)
    await service.logout_all(current_user.id)


@router.get("/me", response_model=UserRead)
async def get_me(current_user=Depends(get_current_user)):
    """Retorna los datos del usuario autenticado."""
    return UserRead.model_validate(current_user)
