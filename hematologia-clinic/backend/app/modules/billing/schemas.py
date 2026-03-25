"""Schemas Pydantic para facturación."""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class PatientSummary(BaseModel):
    id: str
    full_name: str
    medical_record_number: str
    model_config = {"from_attributes": True}


class UserSummary(BaseModel):
    id: str
    full_name: str
    model_config = {"from_attributes": True}


# ─── Invoice Items ───

class InvoiceItemCreate(BaseModel):
    service_id: Optional[str] = None
    description: str
    quantity: int = 1
    unit_price: float


class InvoiceItemRead(BaseModel):
    id: str
    service_id: Optional[str] = None
    description: str
    quantity: int
    unit_price: float
    total: float
    model_config = {"from_attributes": True}


# ─── Invoices ───

class InvoiceCreate(BaseModel):
    patient_id: str
    issue_date: date
    due_date: Optional[date] = None
    insurance_provider: Optional[str] = None
    insurance_batch_number: Optional[str] = None
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    due_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class InvoiceRead(BaseModel):
    id: str
    patient_id: str
    invoice_number: str
    issue_date: date
    due_date: Optional[date] = None
    status: str
    subtotal: float
    tax: float
    total: float
    paid_amount: float
    insurance_provider: Optional[str] = None
    insurance_batch_number: Optional[str] = None
    notes: Optional[str] = None
    pdf_path: Optional[str] = None
    items: List[InvoiceItemRead] = []
    payments: List["PaymentRead"] = []
    patient: Optional[PatientSummary] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class InvoiceList(BaseModel):
    items: List[InvoiceRead]
    total: int
    page: int
    size: int
    pages: int


# ─── Payments ───

class PaymentCreate(BaseModel):
    amount: float
    payment_method: str
    payment_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentRead(BaseModel):
    id: str
    invoice_id: str
    patient_id: str
    amount: float
    payment_method: str
    payment_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None
    received_by: Optional[UserSummary] = None
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Insurance Orders ───

class InsuranceOrderCreate(BaseModel):
    patient_id: str
    service_id: str
    insurance_provider: str
    notes: Optional[str] = None


class InsuranceOrderUpdate(BaseModel):
    status: Optional[str] = None
    authorization_number: Optional[str] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None


class InsuranceOrderRead(BaseModel):
    id: str
    patient_id: str
    service_id: str
    insurance_provider: str
    authorization_number: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    patient: Optional[PatientSummary] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class InsuranceOrderList(BaseModel):
    items: List[InsuranceOrderRead]
    total: int
    page: int
    size: int
    pages: int


# Resolve forward reference
InvoiceRead.model_rebuild()
