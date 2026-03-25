"""Lógica de negocio del módulo de facturación."""
from datetime import date, datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError, ValidationError
from app.modules.billing.models import (
    InsuranceOrder,
    InsuranceOrderStatus,
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    Payment,
)
from app.modules.billing.repository import (
    InsuranceOrderRepository,
    InvoiceRepository,
    PaymentRepository,
)
from app.modules.billing.schemas import (
    InsuranceOrderCreate,
    InsuranceOrderUpdate,
    InvoiceCreate,
    InvoiceUpdate,
    PaymentCreate,
)
from app.modules.patients.repository import PatientRepository

# Transiciones de estado válidas para órdenes de obra social
INSURANCE_TRANSITIONS: dict[str, list[str]] = {
    InsuranceOrderStatus.PENDING_AUTH: [
        InsuranceOrderStatus.AUTHORIZED,
        InsuranceOrderStatus.REJECTED,
    ],
    InsuranceOrderStatus.AUTHORIZED: [InsuranceOrderStatus.SUBMITTED],
    InsuranceOrderStatus.SUBMITTED: [InsuranceOrderStatus.COLLECTED],
    InsuranceOrderStatus.REJECTED: [],
    InsuranceOrderStatus.COLLECTED: [],
}


def _generate_invoice_number(year: int, sequence: int) -> str:
    return f"FAC-{year}-{sequence:04d}"


class BillingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.invoice_repo = InvoiceRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.insurance_repo = InsuranceOrderRepository(db)

    # ─── Facturas ───

    async def create_invoice(self, data: InvoiceCreate, created_by_id: str) -> Invoice:
        patient_repo = PatientRepository(self.db)
        patient = await patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise NotFoundError("Paciente", data.patient_id)

        if not data.items:
            raise ValidationError("La factura debe tener al menos un ítem.")

        # Generar número correlativo
        year = data.issue_date.year
        last_num = await self.invoice_repo.get_last_number_of_year(year)
        invoice_number = _generate_invoice_number(year, last_num + 1)

        # Calcular totales
        subtotal = sum(item.quantity * item.unit_price for item in data.items)
        invoice = Invoice(
            patient_id=data.patient_id,
            invoice_number=invoice_number,
            issue_date=data.issue_date,
            due_date=data.due_date,
            insurance_provider=data.insurance_provider,
            insurance_batch_number=data.insurance_batch_number,
            notes=data.notes,
            subtotal=subtotal,
            tax=0.0,
            total=subtotal,
            paid_amount=0.0,
            status=InvoiceStatus.PENDING,
        )

        items = [
            InvoiceItem(
                invoice_id=invoice.id,
                service_id=item.service_id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total=round(item.quantity * item.unit_price, 2),
            )
            for item in data.items
        ]

        return await self.invoice_repo.create(invoice, items)

    async def update_invoice(self, invoice_id: str, data: InvoiceUpdate) -> Invoice:
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Factura", invoice_id)

        if invoice.status == InvoiceStatus.CANCELLED:
            raise ConflictError("No se puede modificar una factura cancelada.")

        if data.due_date is not None:
            invoice.due_date = data.due_date
        if data.notes is not None:
            invoice.notes = data.notes
        if data.status is not None:
            invoice.status = data.status

        return await self.invoice_repo.save(invoice)

    async def register_payment(
        self, invoice_id: str, data: PaymentCreate, received_by_id: str
    ) -> Invoice:
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Factura", invoice_id)

        if invoice.status == InvoiceStatus.PAID:
            raise ConflictError("La factura ya está completamente pagada.")
        if invoice.status == InvoiceStatus.CANCELLED:
            raise ConflictError("No se puede registrar un pago en una factura cancelada.")

        remaining = float(invoice.total) - float(invoice.paid_amount)
        if data.amount > remaining + 0.01:
            raise ValidationError(
                f"El monto excede el saldo pendiente (${remaining:.2f})."
            )

        payment = Payment(
            invoice_id=invoice_id,
            patient_id=invoice.patient_id,
            amount=data.amount,
            payment_method=data.payment_method,
            payment_date=data.payment_date,
            reference=data.reference,
            notes=data.notes,
            received_by_id=received_by_id,
        )
        await self.payment_repo.create(payment)

        # Actualizar estado de la factura
        new_paid = float(invoice.paid_amount) + data.amount
        invoice.paid_amount = round(new_paid, 2)
        if abs(new_paid - float(invoice.total)) < 0.01:
            invoice.status = InvoiceStatus.PAID
        else:
            invoice.status = InvoiceStatus.PARTIAL

        return await self.invoice_repo.save(invoice)

    # ─── Órdenes de obra social ───

    async def create_insurance_order(
        self, data: InsuranceOrderCreate
    ) -> InsuranceOrder:
        patient_repo = PatientRepository(self.db)
        patient = await patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise NotFoundError("Paciente", data.patient_id)

        order = InsuranceOrder(
            patient_id=data.patient_id,
            service_id=data.service_id,
            insurance_provider=data.insurance_provider,
            notes=data.notes,
            status=InsuranceOrderStatus.PENDING_AUTH,
        )
        return await self.insurance_repo.create(order)

    async def update_insurance_order(
        self, order_id: str, data: InsuranceOrderUpdate
    ) -> InsuranceOrder:
        order = await self.insurance_repo.get_by_id(order_id)
        if not order:
            raise NotFoundError("Orden de obra social", order_id)

        if data.status is not None:
            allowed = INSURANCE_TRANSITIONS.get(order.status, [])
            if data.status not in allowed:
                raise ConflictError(
                    f"No se puede pasar de '{order.status}' a '{data.status}'."
                )
            order.status = data.status

        if data.authorization_number is not None:
            order.authorization_number = data.authorization_number
        if data.rejection_reason is not None:
            order.rejection_reason = data.rejection_reason
        if data.notes is not None:
            order.notes = data.notes

        return await self.insurance_repo.save(order)
