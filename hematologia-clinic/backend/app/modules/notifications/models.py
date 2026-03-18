"""Modelo de notificaciones."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDMixin


class Notification(Base, UUIDMixin, TimestampMixin):
    """Notificación para un usuario del sistema."""
    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # result_ready, appointment_reminder, etc.
    channel: Mapped[str] = mapped_column(
        String(20), nullable=False, default="in_app"
    )  # in_app, email, whatsapp

    # Datos adicionales (link a recurso, etc.)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True, default=dict)

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
