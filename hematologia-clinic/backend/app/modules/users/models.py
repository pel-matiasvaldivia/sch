"""
Modelos de usuarios, roles y permisos.
"""
from datetime import datetime
from typing import List

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class Role(Base, UUIDMixin, TimestampMixin):
    """
    Roles del sistema:
    - admin: acceso total
    - medico: pacientes propios, informes, turnos
    - administrativo: turnos, facturación, obras sociales
    - tecnico: carga resultados, informes técnicos
    - paciente: solo sus propios datos
    """
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relaciones
    users: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="role")


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Usuario del sistema."""
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )  # True en primer login

    # 2FA
    totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Bloqueo por intentos fallidos
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)

    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relaciones
    roles: Mapped[List["UserRole"]] = relationship(
        "UserRole", back_populates="user", lazy="selectin"
    )

    @property
    def role_names(self) -> List[str]:
        return [ur.role.name for ur in self.roles if ur.role]

    @property
    def is_locked(self) -> bool:
        if self.locked_until is None:
            return False
        from datetime import timezone
        from datetime import datetime as dt
        return dt.now(timezone.utc) < self.locked_until


class UserRole(Base, TimestampMixin):
    """Tabla de unión entre usuarios y roles (ManyToMany)."""
    __tablename__ = "user_roles"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )

    # Relaciones
    user: Mapped["User"] = relationship("User", back_populates="roles")
    role: Mapped["Role"] = relationship("Role", back_populates="users", lazy="selectin")
