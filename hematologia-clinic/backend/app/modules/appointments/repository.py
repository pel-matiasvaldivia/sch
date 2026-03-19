"""Repositorio de turnos."""
import math
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.appointments.models import Appointment, AppointmentStatus


class AppointmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, appointment_id: str) -> Optional[Appointment]:
        stmt = (
            select(Appointment)
            .options(
                selectinload(Appointment.patient),
                selectinload(Appointment.doctor),
            )
            .where(
                Appointment.id == appointment_id,
                Appointment.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        doctor_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        service_type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Tuple[List[Appointment], int]:
        base_query = (
            select(Appointment)
            .options(
                selectinload(Appointment.patient),
                selectinload(Appointment.doctor),
            )
            .where(Appointment.deleted_at.is_(None))
        )

        if doctor_id:
            base_query = base_query.where(Appointment.doctor_id == doctor_id)
        if patient_id:
            base_query = base_query.where(Appointment.patient_id == patient_id)
        if status:
            base_query = base_query.where(Appointment.status == status)
        if service_type:
            base_query = base_query.where(Appointment.service_type == service_type)
        if date_from:
            base_query = base_query.where(Appointment.scheduled_at >= date_from)
        if date_to:
            base_query = base_query.where(Appointment.scheduled_at <= date_to)

        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = (
            base_query
            .order_by(Appointment.scheduled_at)
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def list_for_day(
        self,
        day: date,
        doctor_id: Optional[str] = None,
    ) -> List[Appointment]:
        """Todos los turnos de un día específico."""
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)

        stmt = (
            select(Appointment)
            .options(
                selectinload(Appointment.patient),
                selectinload(Appointment.doctor),
            )
            .where(
                Appointment.deleted_at.is_(None),
                Appointment.scheduled_at >= day_start,
                Appointment.scheduled_at < day_end,
            )
            .order_by(Appointment.scheduled_at)
        )

        if doctor_id:
            stmt = stmt.where(Appointment.doctor_id == doctor_id)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def has_conflict(
        self,
        doctor_id: str,
        scheduled_at: datetime,
        duration_minutes: int,
        exclude_id: Optional[str] = None,
    ) -> bool:
        """Verifica si el médico tiene un turno que se superpone con el horario dado."""
        end_time = scheduled_at + timedelta(minutes=duration_minutes)

        stmt = select(func.count()).where(
            Appointment.doctor_id == doctor_id,
            Appointment.deleted_at.is_(None),
            Appointment.status.notin_([
                AppointmentStatus.CANCELLED,
                AppointmentStatus.ABSENT,
            ]),
            # Superposición: el turno existente empieza antes que nuestro fin
            # y termina después de nuestro inicio
            Appointment.scheduled_at < end_time,
            func.cast(Appointment.scheduled_at, type_=None) + func.cast(
                func.concat(Appointment.duration_minutes, " minutes"), type_=None
            ) > scheduled_at,
        )

        if exclude_id:
            stmt = stmt.where(Appointment.id != exclude_id)

        result = await self.db.execute(stmt)
        return result.scalar_one() > 0

    async def create(self, appointment: Appointment) -> Appointment:
        self.db.add(appointment)
        await self.db.flush()
        return await self.get_by_id(appointment.id)
