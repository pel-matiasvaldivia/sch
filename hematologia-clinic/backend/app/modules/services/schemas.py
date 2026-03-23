"""Schemas Pydantic para el módulo de prestaciones."""
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


class MedicalServiceCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    service_type: str
    location: str = "clinica"
    clinical_observations: Optional[str] = None
    service_data: Optional[Dict[str, Any]] = None


class MedicalServiceUpdate(BaseModel):
    status: Optional[str] = None
    performed_by_id: Optional[str] = None
    performed_at: Optional[datetime] = None
    clinical_observations: Optional[str] = None
    service_data: Optional[Dict[str, Any]] = None


class MedicalServiceRead(BaseModel):
    id: str
    patient_id: str
    appointment_id: Optional[str] = None
    performed_by_id: Optional[str] = None
    requested_by_id: str
    service_type: str
    status: str
    location: str
    performed_at: Optional[datetime] = None
    clinical_observations: Optional[str] = None
    service_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientSummary] = None
    performed_by: Optional[UserSummary] = None
    requested_by: Optional[UserSummary] = None

    model_config = {"from_attributes": True}


class MedicalServiceList(BaseModel):
    items: List[MedicalServiceRead]
    total: int
    page: int
    size: int
    pages: int
