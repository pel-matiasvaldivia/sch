"""Router de usuarios — CRUD y gestión de roles."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user, require_roles
from app.modules.users.schemas import (
    ChangePasswordRequest,
    UserCreate,
    UserList,
    UserRead,
    UserUpdate,
)
from app.modules.users.service import UserService

router = APIRouter(prefix="/v1/users", tags=["Usuarios"])

DBDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("/", response_model=UserList)
async def list_users(
    db: DBDep,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    _user=Depends(require_roles("admin")),
):
    """Lista todos los usuarios. Solo admin."""
    service = UserService(db)
    return await service.list_users(page, size, search, role)


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: DBDep,
    current_user=Depends(require_roles("admin")),
):
    """Crea un nuevo usuario. Solo admin."""
    service = UserService(db)
    user = await service.create_user(data, created_by_id=current_user.id)
    return UserRead.model_validate(user)


@router.get("/me", response_model=UserRead)
async def get_me(current_user=Depends(get_current_user)):
    """Retorna el usuario autenticado actual."""
    return UserRead.model_validate(current_user)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: str,
    db: DBDep,
    _user=Depends(require_roles("admin")),
):
    """Obtiene un usuario por ID. Solo admin."""
    service = UserService(db)
    user = await service.get_user(user_id)
    return UserRead.model_validate(user)


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: DBDep,
    current_user=Depends(require_roles("admin")),
):
    """Actualiza datos de un usuario. Solo admin."""
    service = UserService(db)
    user = await service.update_user(user_id, data, current_user.id)
    return UserRead.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: DBDep,
    _user=Depends(require_roles("admin")),
):
    """Soft-delete de un usuario. Solo admin."""
    service = UserService(db)
    await service.soft_delete_user(user_id)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest,
    db: DBDep,
    current_user=Depends(get_current_user),
):
    """Cambia la contraseña del usuario autenticado."""
    service = UserService(db)
    await service.change_password(
        current_user.id, data.current_password, data.new_password
    )
