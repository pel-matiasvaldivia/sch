"""
Dependencies compartidas de FastAPI para toda la aplicación.
"""
from typing import Annotated, Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db

# Re-exportar get_db para conveniencia
DBDep = Annotated[AsyncSession, Depends(get_db)]

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: DBDep,
    access_token: Annotated[Optional[str], Cookie()] = None,
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

    # Acepta token desde header Authorization o desde cookie httpOnly
    token = None
    if credentials:
        token = credentials.credentials
    elif access_token:
        token = access_token

    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)
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
        user_roles = set(current_user.role_names)
        if not user_roles.intersection(set(roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de: {', '.join(roles)}",
            )
        return current_user

    return _check_roles


# Tipos anotados para uso en routers
CurrentUser = Annotated[any, Depends(get_current_user)]
