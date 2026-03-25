"""Modelo de informes médicos."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.patients.models import Patient
    from app.modules.users.models import User


def generate_access_token() -> str:
    return str(uuid.uuid4()).replace("-", "")


class Report(Base, UUIDMixin, TimestampMixin):
    """Informe médico generado para un paciente."""
    __tablename__ = "reports"

    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    service_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("medical_services.id"), nullable=True
    )
    signed_by_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )

    report_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="borrador", index=True
    )  # borrador / firmado / entregado

    content: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)

    pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    access_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, default=generate_access_token, index=True
    )
    access_token_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    signed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_corrected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    previous_version_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("reports.id"), nullable=True
    )

    notification_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relaciones
    patient: Mapped["Patient"] = relationship("Patient", back_populates="reports")
    created_by: Mapped["User"] = relationship("User", foreign_keys=[created_by_id])
    signed_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[signed_by_id])
