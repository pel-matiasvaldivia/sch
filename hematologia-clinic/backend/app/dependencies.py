"""
Dependencies compartidas de FastAPI para toda la aplicación.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db

# Re-exportar get_db para conveniencia
DBDep = Annotated[AsyncSession, Depends(get_db)]

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DBDep,
):
    """
    Dependency que extrae y valida el usuario del JWT.
    Importación diferida para evitar imports circulares.
    """
    from app.modules.users.repository import UserRepository

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)

    if user is None or user.is_deleted:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta inactiva",
        )

    return user


def require_roles(*roles: str):
    """
    Dependency factory: verifica que el usuario tiene al menos uno de los roles.

    Uso:
        @router.get("/admin")
        async def admin_only(user = Depends(require_roles("admin"))):
            ...
    """
    async def _check_roles(
        current_user=Depends(get_current_user),
    ):
        user_roles = {r.name for r in current_user.roles}
        if not user_roles.intersection(set(roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de: {', '.join(roles)}",
            )
        return current_user

    return _check_roles


# Tipos anotados para uso en routers
CurrentUser = Annotated[any, Depends(get_current_user)]
