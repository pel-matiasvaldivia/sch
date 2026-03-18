"""Modelos de facturación: órdenes, cobros e invoices."""
import enum
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class InsuranceOrderStatus(str, enum.Enum):
    PENDING_AUTH = "pendiente_autorizacion"
    AUTHORIZED = "autorizada"
    REJECTED = "rechazada"
    SUBMITTED = "presentada"
    COLLECTED = "cobrada"


class PaymentMethod(str, enum.Enum):
    CASH = "efectivo"
    TRANSFER = "transferencia"
    CARD = "tarjeta"
    INSURANCE = "obra_social"


class InvoiceStatus(str, enum.Enum):
    PENDING = "pendiente"
    PAID = "pagada"
    PARTIAL = "parcial"
    CANCELLED = "cancelada"


class InsuranceOrder(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Orden de obra social por prestación."""
    __tablename__ = "insurance_orders"

    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    service_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("medical_services.id"), nullable=False
    )

    insurance_provider: Mapped[str] = mapped_column(String(200), nullable=False)
    authorization_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=InsuranceOrderStatus.PENDING_AUTH
    )
    order_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Invoice(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Factura o comprobante de pago."""
    __tablename__ = "invoices"

    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    invoice_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=InvoiceStatus.PENDING
    )

    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    tax: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    # Para facturas a obras sociales
    insurance_provider: Mapped[str | None] = mapped_column(String(200), nullable=True)
    insurance_batch_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)


class InvoiceItem(Base, UUIDMixin, TimestampMixin):
    """Línea de detalle de una factura."""
    __tablename__ = "invoice_items"

    invoice_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False
    )
    service_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("medical_services.id"), nullable=True
    )
    description: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)


class Payment(Base, UUIDMixin, TimestampMixin):
    """Registro de pago."""
    __tablename__ = "payments"

    invoice_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("invoices.id"), nullable=False, index=True
    )
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_by_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
