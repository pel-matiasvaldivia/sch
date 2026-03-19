"""Modelo de turnos."""
import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.patients.models import Patient
    from app.modules.users.models import User


class AppointmentStatus(str, enum.Enum):
    PENDING = "pendiente"
    CONFIRMED = "confirmado"
    PRESENT = "presente"
    ABSENT = "ausente"
    CANCELLED = "cancelado"
    IN_PROGRESS = "en_progreso"


class ServiceType(str, enum.Enum):
    CONSULTATION = "consulta_medica"
    HEMATOLOGY = "hematologia"
    COAGULATION = "coagulacion"
    PUNCTURE = "puncion"
    LABORATORY = "laboratorio"
    INFUSION = "infusion"


class AppointmentLocation(str, enum.Enum):
    CLINIC = "clinica"
    HOSPITAL = "hospital"
    GERIATRIC = "geriatrico"
    HOME = "domicilio"


class Appointment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Turno médico."""
    __tablename__ = "appointments"

    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    created_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )

    service_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # ServiceType enum
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=AppointmentStatus.PENDING, index=True
    )
    location: Mapped[str] = mapped_column(
        String(30), nullable=False, default=AppointmentLocation.CLINIC
    )

    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)

    # Notas y observaciones
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Datos extra por tipo de turno (protocolo, medicación, etc.)
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    # Recordatorio enviado
    reminder_sent: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Relaciones
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    doctor: Mapped["User"] = relationship("User", foreign_keys=[doctor_id])
