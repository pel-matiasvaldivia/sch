"""Router de turnos."""
from datetime import date, datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user, require_roles
from app.modules.appointments.schemas import (
    AppointmentCreate,
    AppointmentList,
    AppointmentRead,
    AppointmentStatusUpdate,
    AppointmentUpdate,
)
from app.modules.appointments.service import AppointmentService

router = APIRouter(prefix="/v1/appointments", tags=["Turnos"])

DBDep = Annotated[AsyncSession, Depends(get_db)]

VIEWER_ROLES = ("admin", "medico", "administrativo", "tecnico")
EDITOR_ROLES = ("admin", "medico", "administrativo")


@router.get("", response_model=AppointmentList)
async def list_appointments(
    db: DBDep,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    service_type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    _user=Depends(require_roles(*VIEWER_ROLES)),
):
    """Lista de turnos con filtros por médico, paciente, estado y rango de fechas."""
    service = AppointmentService(db)
    return await service.list_appointments(
        page, size, doctor_id, patient_id, status, service_type, date_from, date_to
    )


@router.get("/today", response_model=AppointmentList)
async def get_today_schedule(
    db: DBDep,
    doctor_id: Optional[str] = Query(None),
    _user=Depends(require_roles(*VIEWER_ROLES)),
):
    """Turnos del día de hoy."""
    service = AppointmentService(db)
    return await service.get_day_schedule(date.today(), doctor_id)


@router.get("/day", response_model=AppointmentList)
async def get_day_schedule(
    db: DBDep,
    day: date = Query(...),
    doctor_id: Optional[str] = Query(None),
    _user=Depends(require_roles(*VIEWER_ROLES)),
):
    """Turnos de un día específico."""
    service = AppointmentService(db)
    return await service.get_day_schedule(day, doctor_id)


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    db: DBDep,
    current_user=Depends(require_roles(*EDITOR_ROLES)),
):
    """Crea un nuevo turno."""
    service = AppointmentService(db)
    appointment = await service.create_appointment(data, created_by_id=current_user.id)
    return AppointmentRead.model_validate(appointment)


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def get_appointment(
    appointment_id: str,
    db: DBDep,
    _user=Depends(require_roles(*VIEWER_ROLES)),
):
    """Obtiene un turno por ID."""
    service = AppointmentService(db)
    appointment = await service.get_appointment(appointment_id)
    return AppointmentRead.model_validate(appointment)


@router.patch("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment(
    appointment_id: str,
    data: AppointmentUpdate,
    db: DBDep,
    _user=Depends(require_roles(*EDITOR_ROLES)),
):
    """Actualiza datos del turno (reprogramar, cambiar médico, agregar notas)."""
    service = AppointmentService(db)
    appointment = await service.update_appointment(appointment_id, data)
    return AppointmentRead.model_validate(appointment)


@router.patch("/{appointment_id}/status", response_model=AppointmentRead)
async def update_appointment_status(
    appointment_id: str,
    data: AppointmentStatusUpdate,
    db: DBDep,
    current_user=Depends(require_roles(*EDITOR_ROLES)),
):
    """Cambia el estado del turno (confirmar, cancelar, marcar presente/ausente)."""
    service = AppointmentService(db)
    appointment = await service.update_status(appointment_id, data, current_user.id)
    return AppointmentRead.model_validate(appointment)


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: str,
    db: DBDep,
    _user=Depends(require_roles("admin")),
):
    """Elimina un turno permanentemente. Solo admin."""
    service = AppointmentService(db)
    appointment = await service.get_appointment(appointment_id)
    appointment.soft_delete()
    await db.flush()
