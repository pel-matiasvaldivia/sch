"""Modelo de prestaciones médicas."""
import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


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

    # Observaciones clínicas
    clinical_observations: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Datos específicos del subtipo de prestación (valores de lab, protocolo, etc.)
    service_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    # Archivos adjuntos (paths de MinIO)
    attachments: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
