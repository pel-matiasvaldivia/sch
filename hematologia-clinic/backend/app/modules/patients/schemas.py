"""Schemas Pydantic para el módulo de pacientes."""
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class PatientCreate(BaseModel):
    # Personales
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    dni: str = Field(min_length=6, max_length=20)
    birth_date: date
    sex: str = Field(pattern="^(M|F|Otro)$")

    # Contacto
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    phone_alt: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None

    # Emergencia
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50)

    # Cobertura
    insurance_provider: Optional[str] = Field(None, max_length=200)
    insurance_plan: Optional[str] = Field(None, max_length=100)
    insurance_number: Optional[str] = Field(None, max_length=100)

    # Clínico
    blood_type: Optional[str] = Field(None, max_length=5)
    clinical_notes: Optional[Dict[str, Any]] = None

    # Médico tratante
    primary_doctor_id: Optional[str] = None

    @field_validator("dni")
    @classmethod
    def clean_dni(cls, v: str) -> str:
        # Eliminar puntos y espacios del DNI
        return v.replace(".", "").replace(" ", "").strip()


class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    birth_date: Optional[date] = None
    sex: Optional[str] = Field(None, pattern="^(M|F|Otro)$")
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    phone_alt: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50)
    insurance_provider: Optional[str] = Field(None, max_length=200)
    insurance_plan: Optional[str] = Field(None, max_length=100)
    insurance_number: Optional[str] = Field(None, max_length=100)
    blood_type: Optional[str] = Field(None, max_length=5)
    clinical_notes: Optional[Dict[str, Any]] = None
    primary_doctor_id: Optional[str] = None
    portal_access_enabled: Optional[bool] = None


class PatientRead(BaseModel):
    id: str
    medical_record_number: str
    first_name: str
    last_name: str
    full_name: str
    dni: str
    birth_date: date
    sex: str
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    phone: Optional[str] = None
    phone_alt: Optional[str] = None
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_plan: Optional[str] = None
    insurance_number: Optional[str] = None
    blood_type: Optional[str] = None
    clinical_notes: Optional[Dict[str, Any]] = None
    primary_doctor_id: Optional[str] = None
    user_id: Optional[str] = None
    portal_access_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientCreateResponse(PatientRead):
    """Respuesta al crear un paciente — incluye contraseña temporal del usuario vinculado."""
    temp_password: Optional[str] = None
    user_email: Optional[str] = None


class PatientSummary(BaseModel):
    """Vista resumida para listas y búsquedas."""
    id: str
    medical_record_number: str
    full_name: str
    dni: str
    birth_date: date
    phone: Optional[str] = None
    insurance_provider: Optional[str] = None

    model_config = {"from_attributes": True}


class PatientList(BaseModel):
    items: List[PatientRead]
    total: int
    page: int
    size: int
    pages: int


class PatientSearchResult(BaseModel):
    items: List[PatientSummary]
    total: int
