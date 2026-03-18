"""Lógica de negocio para gestión de pacientes."""
import math
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError
from app.modules.patients.models import Patient
from app.modules.patients.repository import PatientRepository
from app.modules.patients.schemas import (
    PatientCreate,
    PatientList,
    PatientRead,
    PatientSearchResult,
    PatientSummary,
    PatientUpdate,
)


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PatientRepository(db)

    async def create_patient(self, data: PatientCreate, created_by_id: str) -> Patient:
        # Verificar DNI único
        existing = await self.repo.get_by_dni(data.dni)
        if existing:
            raise ConflictError(
                f"Ya existe un paciente con DNI {data.dni} "
                f"(HC: {existing.medical_record_number})"
            )

        patient = Patient(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            dni=data.dni,
            birth_date=data.birth_date,
            sex=data.sex,
            address=data.address,
            city=data.city,
            province=data.province,
            phone=data.phone,
            phone_alt=data.phone_alt,
            email=data.email,
            emergency_contact_name=data.emergency_contact_name,
            emergency_contact_phone=data.emergency_contact_phone,
            emergency_contact_relationship=data.emergency_contact_relationship,
            insurance_provider=data.insurance_provider,
            insurance_plan=data.insurance_plan,
            insurance_number=data.insurance_number,
            blood_type=data.blood_type,
            clinical_notes=data.clinical_notes or {},
            primary_doctor_id=data.primary_doctor_id,
            created_by_id=created_by_id,
        )
        return await self.repo.create(patient)

    async def get_patient(self, patient_id: str) -> Patient:
        patient = await self.repo.get_by_id(patient_id)
        if not patient:
            raise NotFoundError("Paciente", patient_id)
        return patient

    async def update_patient(self, patient_id: str, data: PatientUpdate) -> Patient:
        patient = await self.repo.get_by_id(patient_id)
        if not patient:
            raise NotFoundError("Paciente", patient_id)

        # Aplicar solo los campos que vienen en el payload
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)

        await self.db.flush()
        await self.db.refresh(patient)
        return patient

    async def soft_delete_patient(self, patient_id: str) -> None:
        patient = await self.repo.get_by_id(patient_id)
        if not patient:
            raise NotFoundError("Paciente", patient_id)
        patient.soft_delete()
        await self.db.flush()

    async def list_patients(
        self,
        page: int = 1,
        size: int = 20,
        search: Optional[str] = None,
        insurance_provider: Optional[str] = None,
        doctor_id: Optional[str] = None,
    ) -> PatientList:
        patients, total = await self.repo.list_paginated(
            page, size, search, insurance_provider, doctor_id
        )
        pages = math.ceil(total / size) if size > 0 else 0
        return PatientList(
            items=[PatientRead.model_validate(p) for p in patients],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    async def search_patients(self, query: str, limit: int = 20) -> PatientSearchResult:
        """Búsqueda rápida para autocompletar (name, DNI, HC)."""
        patients = await self.repo.search(query, limit)
        return PatientSearchResult(
            items=[PatientSummary.model_validate(p) for p in patients],
            total=len(patients),
        )
