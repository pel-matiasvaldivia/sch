"""Repositorio de usuarios — operaciones de base de datos."""
from typing import List, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.users.models import Role, User, UserRole


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .options(selectinload(User.roles).selectinload(UserRole.role))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(func.lower(User.email) == email.lower(), User.deleted_at.is_(None))
            .options(selectinload(User.roles).selectinload(UserRole.role))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        search: Optional[str] = None,
        role_name: Optional[str] = None,
    ) -> tuple[List[User], int]:
        base_query = select(User).where(User.deleted_at.is_(None))

        if search:
            term = f"%{search}%"
            base_query = base_query.where(
                or_(
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                )
            )

        if role_name:
            base_query = base_query.join(User.roles).join(UserRole.role).where(
                Role.name == role_name
            )

        # Count total
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginated query
        stmt = (
            base_query
            .options(selectinload(User.roles).selectinload(UserRole.role))
            .order_by(User.full_name)
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(stmt)
        users = list(result.scalars().all())

        return users, total

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_role_by_name(self, name: str) -> Optional[Role]:
        stmt = select(Role).where(Role.name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_roles_by_names(self, names: List[str]) -> List[Role]:
        stmt = select(Role).where(Role.name.in_(names))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_role(self, role: Role) -> Role:
        self.db.add(role)
        await self.db.flush()
        return role
