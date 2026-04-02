"""Schemas Pydantic para el módulo de turnos."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.modules.appointments.models import AppointmentLocation, AppointmentStatus, ServiceType


class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    service_type: str
    scheduled_at: datetime
    duration_minutes: int = Field(30, ge=5, le=480)
    location: str = "clinica"
    notes: Optional[str] = Field(None, max_length=2000)
    extra_data: Optional[Dict[str, Any]] = None


class AppointmentUpdate(BaseModel):
    doctor_id: Optional[str] = None
    service_type: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    location: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)
    extra_data: Optional[Dict[str, Any]] = None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    cancellation_reason: Optional[str] = Field(None, max_length=500)


class PatientSummary(BaseModel):
    id: str
    full_name: str
    dni: str
    medical_record_number: str
    phone: Optional[str] = None

    model_config = {"from_attributes": True}


class DoctorSummary(BaseModel):
    id: str
    full_name: str

    model_config = {"from_attributes": True}


class AppointmentRead(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    created_by_id: str
    service_type: str
    status: str
    location: str
    scheduled_at: datetime
    duration_minutes: int
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None
    reminder_sent: bool
    concluded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Datos embebidos para evitar N+1 en el frontend
    patient: Optional[PatientSummary] = None
    doctor: Optional[DoctorSummary] = None

    model_config = {"from_attributes": True}


class AppointmentList(BaseModel):
    items: List[AppointmentRead]
    total: int
    page: int
    size: int
    pages: int
