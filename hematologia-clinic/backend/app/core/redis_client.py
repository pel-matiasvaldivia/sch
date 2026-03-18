"""
Cliente Redis para caché, sesiones y cola de tareas.
"""
import hashlib
from typing import Any

import redis.asyncio as aioredis

from app.config import get_settings

settings = get_settings()

# Pool de conexiones global
_redis_pool: aioredis.Redis | None = None


async def get_redis_pool() -> aioredis.Redis:
    """Retorna el pool de conexiones Redis (singleton)."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50,
        )
    return _redis_pool


async def get_redis() -> aioredis.Redis:
    """Dependency de FastAPI para obtener el cliente Redis."""
    return await get_redis_pool()


# ─── Helpers para Refresh Tokens ───

def _hash_token(token: str) -> str:
    """Hash SHA-256 del token para almacenar en Redis (no guardar el token crudo)."""
    return hashlib.sha256(token.encode()).hexdigest()


async def store_refresh_token(redis: aioredis.Redis, user_id: str, token: str) -> None:
    """Almacena un refresh token hasheado con TTL."""
    key = f"refresh:{user_id}:{_hash_token(token)}"
    ttl = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400
    await redis.setex(key, ttl, "valid")


async def is_refresh_token_valid(
    redis: aioredis.Redis, user_id: str, token: str
) -> bool:
    """Verifica si un refresh token existe y es válido en Redis."""
    key = f"refresh:{user_id}:{_hash_token(token)}"
    return await redis.exists(key) == 1


async def revoke_refresh_token(redis: aioredis.Redis, user_id: str, token: str) -> None:
    """Invalida un refresh token específico."""
    key = f"refresh:{user_id}:{_hash_token(token)}"
    await redis.delete(key)


async def revoke_all_user_tokens(redis: aioredis.Redis, user_id: str) -> None:
    """Revoca todos los refresh tokens del usuario (logout en todos los dispositivos)."""
    pattern = f"refresh:{user_id}:*"
    keys = await redis.keys(pattern)
    if keys:
        await redis.delete(*keys)


# ─── Helpers para bloqueo de cuenta ───

async def increment_failed_login(redis: aioredis.Redis, identifier: str) -> int:
    """Incrementa el contador de intentos fallidos. Retorna el conteo actual."""
    key = f"failed_login:{identifier}"
    count = await redis.incr(key)
    if count == 1:
        # Setear TTL solo en el primer intento
        await redis.expire(key, settings.LOCKOUT_DURATION_MINUTES * 60)
    return count


async def clear_failed_login(redis: aioredis.Redis, identifier: str) -> None:
    """Limpia el contador de intentos fallidos (login exitoso)."""
    await redis.delete(f"failed_login:{identifier}")


async def get_failed_login_count(redis: aioredis.Redis, identifier: str) -> int:
    """Obtiene el número de intentos fallidos actuales."""
    val = await redis.get(f"failed_login:{identifier}")
    return int(val) if val else 0
