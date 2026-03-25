"""Repositorio de informes médicos."""
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.modules.patients.models import Patient
from app.modules.reports.models import Report


class ReportRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_options(self):
        return [
            selectinload(Report.patient),
            selectinload(Report.created_by),
            selectinload(Report.signed_by),
        ]

    async def get_by_id(self, report_id: str) -> Optional[Report]:
        stmt = (
            select(Report)
            .options(*self._base_options())
            .where(Report.id == report_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_access_token(self, token: str) -> Optional[Report]:
        stmt = (
            select(Report)
            .options(*self._base_options())
            .where(Report.access_token == token)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        report_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Report], int]:
        base_query = (
            select(Report)
            .options(*self._base_options())
        )
        if patient_id:
            base_query = base_query.where(Report.patient_id == patient_id)
        if status:
            base_query = base_query.where(Report.status == status)
        if report_type:
            base_query = base_query.where(Report.report_type == report_type)
        if search:
            term = f"%{search}%"
            base_query = base_query.join(Patient, Report.patient_id == Patient.id).where(
                or_(
                    Patient.first_name.ilike(term),
                    Patient.last_name.ilike(term),
                    Patient.dni.ilike(term),
                )
            )

        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = (
            base_query
            .order_by(Report.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, report: Report) -> Report:
        self.db.add(report)
        await self.db.flush()
        return await self.get_by_id(report.id)  # type: ignore[return-value]

    async def save(self, report: Report) -> Report:
        await self.db.flush()
        return await self.get_by_id(report.id)  # type: ignore[return-value]

    async def delete(self, report: Report) -> None:
        await self.db.delete(report)
        await self.db.flush()
