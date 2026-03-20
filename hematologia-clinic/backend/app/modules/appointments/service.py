"""Lógica de negocio para gestión de turnos."""
import math
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError, ValidationError
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.appointments.repository import AppointmentRepository
from app.modules.appointments.schemas import (
    AppointmentCreate,
    AppointmentList,
    AppointmentRead,
    AppointmentStatusUpdate,
    AppointmentUpdate,
)
from app.modules.patients.repository import PatientRepository
from app.modules.users.repository import UserRepository

# Transiciones de estado permitidas
ALLOWED_TRANSITIONS = {
    AppointmentStatus.PENDING: {
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.ABSENT,
    },
    AppointmentStatus.CONFIRMED: {
        AppointmentStatus.PRESENT,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.ABSENT,
        AppointmentStatus.CANCELLED,
    },
    AppointmentStatus.IN_PROGRESS: {
        AppointmentStatus.PRESENT,
        AppointmentStatus.ABSENT,
        AppointmentStatus.CONCLUDED,
    },
    AppointmentStatus.PRESENT: {AppointmentStatus.IN_PROGRESS},
    AppointmentStatus.ABSENT: set(),
    AppointmentStatus.CANCELLED: set(),
    AppointmentStatus.CONCLUDED: set(),
}


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AppointmentRepository(db)

    async def create_appointment(
        self, data: AppointmentCreate, created_by_id: str
    ) -> Appointment:
        # Verificar que el paciente existe
        patient_repo = PatientRepository(self.db)
        patient = await patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise NotFoundError("Paciente", data.patient_id)

        # Verificar que el médico existe
        user_repo = UserRepository(self.db)
        doctor = await user_repo.get_by_id(data.doctor_id)
        if not doctor:
            raise NotFoundError("Médico", data.doctor_id)

        # Verificar que el turno no está en el pasado
        now = datetime.now(timezone.utc)
        scheduled = data.scheduled_at
        if scheduled.tzinfo is None:
            scheduled = scheduled.replace(tzinfo=timezone.utc)
        if scheduled < now:
            raise ValidationError("No se puede crear un turno en el pasado")

        appointment = Appointment(
            patient_id=data.patient_id,
            doctor_id=data.doctor_id,
            created_by_id=created_by_id,
            service_type=data.service_type.value,
            status=AppointmentStatus.PENDING.value,
            location=data.location.value,
            scheduled_at=scheduled,
            duration_minutes=data.duration_minutes,
            notes=data.notes,
            extra_data=data.extra_data or {},
        )

        return await self.repo.create(appointment)

    async def get_appointment(self, appointment_id: str) -> Appointment:
        appointment = await self.repo.get_by_id(appointment_id)
        if not appointment:
            raise NotFoundError("Turno", appointment_id)
        return appointment

    async def update_appointment(
        self, appointment_id: str, data: AppointmentUpdate
    ) -> Appointment:
        appointment = await self.repo.get_by_id(appointment_id)
        if not appointment:
            raise NotFoundError("Turno", appointment_id)

        if appointment.status in (
            AppointmentStatus.CANCELLED.value,
            AppointmentStatus.PRESENT.value,
        ):
            raise ConflictError(
                f"No se puede modificar un turno en estado '{appointment.status}'"
            )

        update_data = data.model_dump(exclude_unset=True)

        if "scheduled_at" in update_data:
            scheduled = update_data["scheduled_at"]
            if scheduled.tzinfo is None:
                scheduled = scheduled.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if scheduled < now:
                raise ValidationError("No se puede reprogramar a una fecha pasada")
            update_data["scheduled_at"] = scheduled

        if "service_type" in update_data:
            update_data["service_type"] = update_data["service_type"].value

        if "location" in update_data:
            update_data["location"] = update_data["location"].value

        for field, value in update_data.items():
            setattr(appointment, field, value)

        await self.db.flush()
        await self.db.refresh(appointment)
        return appointment

    async def update_status(
        self, appointment_id: str, data: AppointmentStatusUpdate, user_id: str
    ) -> Appointment:
        appointment = await self.repo.get_by_id(appointment_id)
        if not appointment:
            raise NotFoundError("Turno", appointment_id)

        current = AppointmentStatus(appointment.status)
        new_status = data.status
        allowed = ALLOWED_TRANSITIONS.get(current, set())

        if new_status not in allowed:
            raise ConflictError(
                f"Transición de '{current.value}' a '{new_status.value}' no permitida"
            )

        if new_status == AppointmentStatus.CANCELLED and not data.cancellation_reason:
            raise ValidationError("Se requiere motivo de cancelación")

        appointment.status = new_status.value
        if data.cancellation_reason:
            appointment.cancellation_reason = data.cancellation_reason

        await self.db.flush()
        await self.db.refresh(appointment)
        return appointment

    async def list_appointments(
        self,
        page: int = 1,
        size: int = 20,
        doctor_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        service_type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> AppointmentList:
        appointments, total = await self.repo.list_paginated(
            page, size, doctor_id, patient_id, status, service_type, date_from, date_to
        )
        pages = math.ceil(total / size) if size > 0 else 0
        return AppointmentList(
            items=[AppointmentRead.model_validate(a) for a in appointments],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    async def get_day_schedule(
        self, day: date, doctor_id: Optional[str] = None
    ) -> AppointmentList:
        appointments = await self.repo.list_for_day(day, doctor_id)
        return AppointmentList(
            items=[AppointmentRead.model_validate(a) for a in appointments],
            total=len(appointments),
            page=1,
            size=len(appointments) or 1,
            pages=1,
        )

    async def cancel_appointment(
        self, appointment_id: str, reason: str, user_id: str
    ) -> None:
        appointment = await self.repo.get_by_id(appointment_id)
        if not appointment:
            raise NotFoundError("Turno", appointment_id)

        if appointment.status == AppointmentStatus.CANCELLED.value:
            raise ConflictError("El turno ya está cancelado")

        appointment.status = AppointmentStatus.CANCELLED.value
        appointment.cancellation_reason = reason
        await self.db.flush()
