"""Modelo de prestaciones médicas."""
import enum
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.patients.models import Patient
    from app.modules.appointments.models import Appointment
    from app.modules.users.models import User


class ServiceStatus(str, enum.Enum):
    REQUESTED = "solicitada"
    IN_PROGRESS = "en_proceso"
    COMPLETED = "completada"
    CANCELLED = "cancelada"


class MedicalService(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Prestación médica (hemograma, punción, consulta, etc.)."""
    __tablename__ = "medical_services"

    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    appointment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("appointments.id"), nullable=True
    )
    performed_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    requested_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )

    service_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=ServiceStatus.REQUESTED, index=True
    )
    location: Mapped[str] = mapped_column(
        String(30), nullable=False, default="clinica"
    )

    performed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    clinical_observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    service_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)
    attachments: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)

    # Relaciones
    patient: Mapped["Patient"] = relationship("Patient", back_populates="medical_services")
    appointment: Mapped[Optional["Appointment"]] = relationship("Appointment")
    performed_by: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[performed_by_id]
    )
    requested_by: Mapped["User"] = relationship(
        "User", foreign_keys=[requested_by_id]
    )
