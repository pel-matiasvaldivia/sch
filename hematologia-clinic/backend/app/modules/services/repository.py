"""Repositorio de prestaciones médicas."""
import math
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.services.models import MedicalService


class MedicalServiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, service_id: str) -> Optional[MedicalService]:
        stmt = (
            select(MedicalService)
            .options(
                selectinload(MedicalService.patient),
                selectinload(MedicalService.performed_by),
                selectinload(MedicalService.requested_by),
            )
            .where(
                MedicalService.id == service_id,
                MedicalService.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        service_type: Optional[str] = None,
    ) -> Tuple[List[MedicalService], int]:
        base_query = (
            select(MedicalService)
            .options(
                selectinload(MedicalService.patient),
                selectinload(MedicalService.performed_by),
                selectinload(MedicalService.requested_by),
            )
            .where(MedicalService.deleted_at.is_(None))
        )

        if patient_id:
            base_query = base_query.where(MedicalService.patient_id == patient_id)
        if status:
            base_query = base_query.where(MedicalService.status == status)
        if service_type:
            base_query = base_query.where(MedicalService.service_type == service_type)

        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = (
            base_query
            .order_by(MedicalService.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, service: MedicalService) -> MedicalService:
        self.db.add(service)
        await self.db.flush()
        return await self.get_by_id(service.id)

    async def soft_delete(self, service: MedicalService) -> None:
        from datetime import datetime, timezone
        service.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
