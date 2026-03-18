"""Modelo de informes médicos."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.patients.models import Patient


def generate_access_token() -> str:
    return str(uuid.uuid4()).replace("-", "")


class Report(Base, UUIDMixin, TimestampMixin):
    """Informe médico generado para un paciente."""
    __tablename__ = "reports"

    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    service_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("medical_services.id"), nullable=True
    )
    signed_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )

    report_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="borrador", index=True
    )  # borrador / firmado / entregado

    # Contenido del informe (valores de referencia, diagnósticos, etc.)
    content: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    # PDF en MinIO
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Acceso sin login para el paciente
    access_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, default=generate_access_token, index=True
    )
    access_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Firma digital
    signed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Versiones (si se corrige un informe)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_corrected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    previous_version_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("reports.id"), nullable=True
    )

    # Notificación enviada al paciente
    notification_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relaciones
    patient: Mapped["Patient"] = relationship("Patient", back_populates="reports")
