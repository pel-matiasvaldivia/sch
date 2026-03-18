"""Modelo de auditoría — registro de todas las acciones del sistema."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import UUIDMixin


class AuditLog(Base, UUIDMixin):
    """
    Registro inmutable de auditoría.
    Cada acción significativa del sistema queda registrada aquí.
    NO tiene soft-delete — los logs de auditoría no se borran.
    """
    __tablename__ = "audit_logs"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Quién realizó la acción (nullable si fue una acción del sistema)
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Qué acción (LOGIN, CREATE_PATIENT, UPDATE_REPORT, etc.)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Sobre qué recurso
    resource_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True, index=True
    )
    resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    # Datos adicionales (request body, diff, etc.)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Contexto de red
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Resultado
    success: Mapped[bool] = mapped_column(default=True, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
