"""Modelo de paciente — datos demográficos y clínicos."""
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.appointments.models import Appointment
    from app.modules.reports.models import Report
    from app.modules.services.models import MedicalService


def generate_medical_record_number() -> str:
    """Genera un número de historia clínica único (HC-XXXXXXXX)."""
    short_uuid = str(uuid.uuid4()).replace("-", "")[:8].upper()
    return f"HC-{short_uuid}"


class Patient(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Historia clínica del paciente."""
    __tablename__ = "patients"

    # ─── Número de historia clínica ───
    medical_record_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        default=generate_medical_record_number,
        index=True,
    )

    # ─── Datos personales ───
    first_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    dni: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[str] = mapped_column(String(10), nullable=False)  # M/F/Otro

    # ─── Datos de contacto ───
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    province: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone_alt: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # ─── Contacto de emergencia ───
    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    emergency_contact_relationship: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    # ─── Cobertura médica ───
    insurance_provider: Mapped[str | None] = mapped_column(String(200), nullable=True)
    insurance_plan: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ─── Datos clínicos ───
    blood_type: Mapped[str | None] = mapped_column(
        String(5), nullable=True
    )  # A+, B-, O+, AB+, etc.
    clinical_notes: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True, default=dict
    )  # Antecedentes estructurados

    # ─── Portal del paciente ───
    portal_access_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # ─── FK al médico tratante principal ───
    primary_doctor_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )

    # ─── Quién creó el registro ───
    created_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )

    # ─── Relaciones ───
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", back_populates="patient", lazy="select"
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report", back_populates="patient", lazy="select"
    )
    medical_services: Mapped[List["MedicalService"]] = relationship(
        "MedicalService", back_populates="patient", lazy="select"
    )

    @property
    def full_name(self) -> str:
        return f"{self.last_name}, {self.first_name}"

    __table_args__ = (
        Index("ix_patients_fullname", "last_name", "first_name"),
        Index("ix_patients_insurance", "insurance_provider"),
    )
