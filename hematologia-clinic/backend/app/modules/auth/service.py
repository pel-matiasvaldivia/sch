"""Lógica de autenticación: login, refresh, logout, 2FA."""
from datetime import datetime, timezone

import pyotp
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.redis_client import (
    clear_failed_login,
    get_failed_login_count,
    increment_failed_login,
    is_refresh_token_valid,
    revoke_all_user_tokens,
    revoke_refresh_token,
    store_refresh_token,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.exceptions import AppException, ValidationError
from app.modules.auth.schemas import TokenResponse, UserTokenInfo
from app.modules.users.repository import UserRepository

settings = get_settings()


class AuthService:
    def __init__(self, db: AsyncSession, redis):
        self.db = db
        self.redis = redis
        self.repo = UserRepository(db)

    async def login(
        self,
        email: str,
        password: str,
        totp_code: str | None,
        ip_address: str,
    ) -> TokenResponse:
        identifier = email.lower()

        # Verificar bloqueo por intentos fallidos
        failed_count = await get_failed_login_count(self.redis, identifier)
        if failed_count >= settings.MAX_LOGIN_ATTEMPTS:
            raise AppException(
                message=(
                    f"Cuenta bloqueada por {settings.LOCKOUT_DURATION_MINUTES} minutos "
                    "debido a múltiples intentos fallidos"
                ),
                code="ACCOUNT_LOCKED",
                status_code=429,
            )

        # Buscar usuario
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            await increment_failed_login(self.redis, identifier)
            raise AppException(
                message="Email o contraseña incorrectos",
                code="INVALID_CREDENTIALS",
                status_code=401,
            )

        if not user.is_active or user.is_deleted:
            raise AppException(
                message="Cuenta inactiva o eliminada",
                code="ACCOUNT_INACTIVE",
                status_code=403,
            )

        # Verificar 2FA si está habilitado
        if user.totp_enabled:
            if not totp_code:
                raise AppException(
                    message="Se requiere código de autenticación de dos factores",
                    code="TOTP_REQUIRED",
                    status_code=401,
                )
            totp = pyotp.TOTP(user.totp_secret)
            if not totp.verify(totp_code, valid_window=1):
                raise AppException(
                    message="Código de autenticación inválido",
                    code="INVALID_TOTP",
                    status_code=401,
                )

        # Login exitoso — limpiar intentos fallidos
        await clear_failed_login(self.redis, identifier)

        # Actualizar último login
        user.last_login_at = datetime.now(timezone.utc)
        user.last_login_ip = ip_address
        user.failed_login_attempts = 0
        await self.db.flush()

        # Generar tokens
        extra_claims = {"roles": user.role_names, "email": user.email}
        access_token = create_access_token(user.id, extra_claims)
        refresh_token = create_refresh_token(user.id)

        # Almacenar refresh token en Redis
        await store_refresh_token(self.redis, user.id, refresh_token)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserTokenInfo(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                roles=user.role_names,
                must_change_password=user.must_change_password,
                totp_enabled=user.totp_enabled,
            ),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Genera un nuevo access token usando el refresh token."""
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError("Token inválido")
            user_id = payload.get("sub")
        except (JWTError, ValueError):
            raise AppException(
                message="Refresh token inválido o expirado",
                code="INVALID_REFRESH_TOKEN",
                status_code=401,
            )

        # Verificar que existe en Redis (no fue revocado)
        if not await is_refresh_token_valid(self.redis, user_id, refresh_token):
            raise AppException(
                message="Refresh token revocado",
                code="REVOKED_REFRESH_TOKEN",
                status_code=401,
            )

        user = await self.repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise AppException(
                message="Usuario no encontrado o inactivo",
                code="USER_NOT_FOUND",
                status_code=401,
            )

        # Rotar refresh token (revoca el viejo, emite uno nuevo)
        await revoke_refresh_token(self.redis, user_id, refresh_token)
        new_refresh_token = create_refresh_token(user_id)
        await store_refresh_token(self.redis, user_id, new_refresh_token)

        extra_claims = {"roles": user.role_names, "email": user.email}
        new_access_token = create_access_token(user_id, extra_claims)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserTokenInfo(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                roles=user.role_names,
                must_change_password=user.must_change_password,
                totp_enabled=user.totp_enabled,
            ),
        )

    async def logout(self, user_id: str, refresh_token: str) -> None:
        """Revoca el refresh token específico."""
        await revoke_refresh_token(self.redis, user_id, refresh_token)

    async def logout_all(self, user_id: str) -> None:
        """Cierra todas las sesiones del usuario."""
        await revoke_all_user_tokens(self.redis, user_id)
