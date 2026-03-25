"""Schemas Pydantic para informes médicos."""
from datetime import datetime
from typing import Any, Dict, List, Optional

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


class ReportCreate(BaseModel):
    patient_id: str
    service_id: Optional[str] = None
    report_type: str
    content: Optional[Dict[str, Any]] = None


class ReportUpdate(BaseModel):
    content: Optional[Dict[str, Any]] = None
    report_type: Optional[str] = None


class ReportRead(BaseModel):
    id: str
    patient_id: str
    service_id: Optional[str] = None
    report_type: str
    status: str
    content: Optional[Dict[str, Any]] = None
    pdf_path: Optional[str] = None
    access_token: str
    signed_at: Optional[datetime] = None
    version: int
    is_corrected: bool
    previous_version_id: Optional[str] = None
    notification_sent: bool
    patient: Optional[PatientSummary] = None
    created_by: Optional[UserSummary] = None
    signed_by: Optional[UserSummary] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ReportList(BaseModel):
    items: List[ReportRead]
    total: int
    page: int
    size: int
    pages: int
