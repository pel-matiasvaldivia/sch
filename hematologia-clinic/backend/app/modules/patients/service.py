"""Lógica de negocio para gestión de pacientes."""
import math
import secrets
import string
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
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


def _generate_temp_password() -> str:
    """Genera una contraseña temporal segura que cumple los requisitos del sistema."""
    upper = secrets.choice(string.ascii_uppercase)
    digit = secrets.choice(string.digits)
    rest = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
    chars = list(upper + digit + rest)
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PatientRepository(db)

    async def create_patient(
        self, data: PatientCreate, created_by_id: str
    ) -> tuple[Patient, str]:
        """Crea un paciente y automáticamente su usuario de tipo 'paciente'.
        Retorna (patient, temp_password).
        """
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
        patient = await self.repo.create(patient)

        # Crear usuario vinculado con rol "paciente"
        temp_password = await self._create_linked_user(patient)

        # Refrescar el paciente porque _create_linked_user hizo flush y lo expiró
        await self.db.refresh(patient)

        return patient, temp_password

    async def _create_linked_user(self, patient: Patient) -> str:
        """Crea un User con rol 'paciente' vinculado al paciente. Retorna temp_password."""
        from app.modules.users.models import User, UserRole
        from app.modules.users.repository import UserRepository

        user_repo = UserRepository(self.db)
        user_email = patient.email or f"{patient.dni}@paciente.local"

        # Si ya existe un usuario con ese email, solo vincularlo
        existing_user = await user_repo.get_by_email(user_email)
        if existing_user:
            patient.user_id = existing_user.id
            await self.db.flush()
            return ""  # Sin contraseña nueva

        temp_password = _generate_temp_password()
        full_name = f"{patient.first_name} {patient.last_name}"

        user = User(
            email=user_email.lower(),
            full_name=full_name,
            phone=patient.phone,
            hashed_password=hash_password(temp_password),
            must_change_password=True,
        )
        user = await user_repo.create(user)

        paciente_role = await user_repo.get_role_by_name("paciente")
        if paciente_role:
            self.db.add(UserRole(user_id=user.id, role_id=paciente_role.id))

        patient.user_id = user.id
        await self.db.flush()

        return temp_password

    async def get_patient(self, patient_id: str) -> Patient:
        patient = await self.repo.get_by_id(patient_id)
        if not patient:
            raise NotFoundError("Paciente", patient_id)
        return patient

    async def get_patient_by_user_id(self, user_id: str) -> Patient:
        patient = await self.repo.get_by_user_id(user_id)
        if not patient:
            raise NotFoundError("Perfil de paciente", user_id)
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
