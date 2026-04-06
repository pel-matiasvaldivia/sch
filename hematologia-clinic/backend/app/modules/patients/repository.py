"""Repositorio de pacientes."""
import math
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.patients.models import Patient


class PatientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, patient_id: str) -> Optional[Patient]:
        stmt = select(Patient).where(
            Patient.id == patient_id,
            Patient.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_dni(self, dni: str) -> Optional[Patient]:
        stmt = select(Patient).where(
            Patient.dni == dni,
            Patient.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_medical_record(self, mrn: str) -> Optional[Patient]:
        stmt = select(Patient).where(
            Patient.medical_record_number == mrn,
            Patient.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        search: Optional[str] = None,
        insurance_provider: Optional[str] = None,
        doctor_id: Optional[str] = None,
    ) -> Tuple[List[Patient], int]:
        base_query = select(Patient).where(Patient.deleted_at.is_(None))

        if search:
            term = f"%{search}%"
            base_query = base_query.where(
                or_(
                    Patient.last_name.ilike(term),
                    Patient.first_name.ilike(term),
                    Patient.dni.ilike(term),
                    Patient.medical_record_number.ilike(term),
                    Patient.email.ilike(term),
                )
            )

        if insurance_provider:
            base_query = base_query.where(
                Patient.insurance_provider.ilike(f"%{insurance_provider}%")
            )

        if doctor_id:
            base_query = base_query.where(Patient.primary_doctor_id == doctor_id)

        # Count
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginated
        stmt = (
            base_query
            .order_by(Patient.last_name, Patient.first_name)
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def search(self, query: str, limit: int = 20) -> List[Patient]:
        """Búsqueda rápida para autocompletar."""
        term = f"%{query}%"
        stmt = (
            select(Patient)
            .where(
                Patient.deleted_at.is_(None),
                or_(
                    Patient.last_name.ilike(term),
                    Patient.first_name.ilike(term),
                    Patient.dni.ilike(term),
                    Patient.medical_record_number.ilike(term),
                )
            )
            .order_by(Patient.last_name, Patient.first_name)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_user_id(self, user_id: str) -> Optional[Patient]:
        stmt = select(Patient).where(
            Patient.user_id == user_id,
            Patient.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, patient: Patient) -> Patient:
        self.db.add(patient)
        await self.db.flush()
        await self.db.refresh(patient)
        return patient
