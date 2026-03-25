"""Repositorio de facturación."""
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.billing.models import InsuranceOrder, Invoice, InvoiceItem, Payment


class InvoiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, invoice_id: str) -> Optional[Invoice]:
        stmt = (
            select(Invoice)
            .options(
                selectinload(Invoice.patient),
                selectinload(Invoice.items),
                selectinload(Invoice.payments).selectinload(Payment.received_by),
            )
            .where(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_last_number_of_year(self, year: int) -> int:
        prefix = f"FAC-{year}-"
        stmt = select(func.max(Invoice.invoice_number)).where(
            Invoice.invoice_number.like(f"{prefix}%")
        )
        result = await self.db.execute(stmt)
        last = result.scalar_one_or_none()
        if not last:
            return 0
        try:
            return int(last.split("-")[-1])
        except (ValueError, IndexError):
            return 0

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[Invoice], int]:
        base_query = (
            select(Invoice)
            .options(
                selectinload(Invoice.patient),
                selectinload(Invoice.items),
                selectinload(Invoice.payments).selectinload(Payment.received_by),
            )
            .where(Invoice.deleted_at.is_(None))
        )
        if patient_id:
            base_query = base_query.where(Invoice.patient_id == patient_id)
        if status:
            base_query = base_query.where(Invoice.status == status)

        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = (
            base_query
            .order_by(Invoice.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, invoice: Invoice, items: List[InvoiceItem]) -> Invoice:
        self.db.add(invoice)
        await self.db.flush()  # Obtener el ID generado antes de insertar items
        for item in items:
            item.invoice_id = invoice.id
            self.db.add(item)
        await self.db.flush()
        return await self.get_by_id(invoice.id)  # type: ignore[return-value]

    async def save(self, invoice: Invoice) -> Invoice:
        await self.db.flush()
        return await self.get_by_id(invoice.id)  # type: ignore[return-value]

    async def soft_delete(self, invoice: Invoice) -> None:
        from datetime import datetime, timezone
        invoice.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()


class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, payment: Payment) -> Payment:
        self.db.add(payment)
        await self.db.flush()
        stmt = (
            select(Payment)
            .options(selectinload(Payment.received_by))
            .where(Payment.id == payment.id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def list_by_invoice(self, invoice_id: str) -> List[Payment]:
        stmt = (
            select(Payment)
            .options(selectinload(Payment.received_by))
            .where(Payment.invoice_id == invoice_id)
            .order_by(Payment.payment_date.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class InsuranceOrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, order_id: str) -> Optional[InsuranceOrder]:
        stmt = (
            select(InsuranceOrder)
            .options(selectinload(InsuranceOrder.patient))
            .where(InsuranceOrder.id == order_id, InsuranceOrder.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        page: int = 1,
        size: int = 20,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Tuple[List[InsuranceOrder], int]:
        base_query = (
            select(InsuranceOrder)
            .options(selectinload(InsuranceOrder.patient))
            .where(InsuranceOrder.deleted_at.is_(None))
        )
        if patient_id:
            base_query = base_query.where(InsuranceOrder.patient_id == patient_id)
        if status:
            base_query = base_query.where(InsuranceOrder.status == status)

        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = (
            base_query
            .order_by(InsuranceOrder.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, order: InsuranceOrder) -> InsuranceOrder:
        self.db.add(order)
        await self.db.flush()
        return await self.get_by_id(order.id)  # type: ignore[return-value]

    async def save(self, order: InsuranceOrder) -> InsuranceOrder:
        await self.db.flush()
        return await self.get_by_id(order.id)  # type: ignore[return-value]
