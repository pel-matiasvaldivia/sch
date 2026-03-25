"""Router de facturación."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user, require_roles
from app.modules.billing.schemas import (
    InsuranceOrderCreate,
    InsuranceOrderList,
    InsuranceOrderRead,
    InsuranceOrderUpdate,
    InvoiceCreate,
    InvoiceList,
    InvoiceRead,
    InvoiceUpdate,
    PaymentCreate,
    PaymentRead,
)
from app.modules.billing.service import BillingService
from app.modules.billing.repository import InsuranceOrderRepository, InvoiceRepository, PaymentRepository
from app.modules.users.models import User

router = APIRouter(prefix="/v1/billing", tags=["Facturación"])


# ─── Facturas ───

@router.get("/invoices/", response_model=InvoiceList)
async def list_invoices(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    repo = InvoiceRepository(db)
    items, total = await repo.list_paginated(
        page=page, size=size, patient_id=patient_id, status=status
    )
    return InvoiceList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 0,
    )


@router.post("/invoices/", response_model=InvoiceRead, status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    service = BillingService(db)
    invoice = await service.create_invoice(data, str(current_user.id))
    await db.commit()
    return invoice


@router.get("/invoices/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    from app.exceptions import NotFoundError
    repo = InvoiceRepository(db)
    invoice = await repo.get_by_id(invoice_id)
    if not invoice:
        raise NotFoundError("Factura", invoice_id)
    return invoice


@router.patch("/invoices/{invoice_id}", response_model=InvoiceRead)
async def update_invoice(
    invoice_id: str,
    data: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    service = BillingService(db)
    invoice = await service.update_invoice(invoice_id, data)
    await db.commit()
    return invoice


@router.post("/invoices/{invoice_id}/payments", response_model=InvoiceRead)
async def register_payment(
    invoice_id: str,
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    service = BillingService(db)
    invoice = await service.register_payment(invoice_id, data, str(current_user.id))
    await db.commit()
    return invoice


@router.get("/invoices/{invoice_id}/payments", response_model=list[PaymentRead])
async def list_payments(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    repo = PaymentRepository(db)
    return await repo.list_by_invoice(invoice_id)


# ─── Órdenes de obra social ───

@router.get("/insurance-orders/", response_model=InsuranceOrderList)
async def list_insurance_orders(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    repo = InsuranceOrderRepository(db)
    items, total = await repo.list_paginated(
        page=page, size=size, patient_id=patient_id, status=status
    )
    return InsuranceOrderList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 0,
    )


@router.post("/insurance-orders/", response_model=InsuranceOrderRead, status_code=201)
async def create_insurance_order(
    data: InsuranceOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    service = BillingService(db)
    order = await service.create_insurance_order(data)
    await db.commit()
    return order


@router.patch("/insurance-orders/{order_id}", response_model=InsuranceOrderRead)
async def update_insurance_order(
    order_id: str,
    data: InsuranceOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "administrativo")),
):
    service = BillingService(db)
    order = await service.update_insurance_order(order_id, data)
    await db.commit()
    return order
