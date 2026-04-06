"""Router de pacientes — CRUD completo y búsqueda."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user, require_roles
from app.modules.patients.schemas import (
    PatientCreate,
    PatientCreateResponse,
    PatientList,
    PatientRead,
    PatientSearchResult,
    PatientUpdate,
)
from app.modules.patients.service import PatientService

router = APIRouter(prefix="/v1/patients", tags=["Pacientes"])

DBDep = Annotated[AsyncSession, Depends(get_db)]

# Roles que pueden ver pacientes
VIEWER_ROLES = ("admin", "medico", "administrativo")
# Roles que pueden crear/editar
EDITOR_ROLES = ("admin", "medico", "administrativo")


@router.get("/me", response_model=PatientRead)
async def get_my_patient_profile(
    db: DBDep,
    current_user=Depends(require_roles("paciente")),
):
    """Devuelve el perfil del paciente asociado al usuario autenticado."""
    service = PatientService(db)
    patient = await service.get_patient_by_user_id(current_user.id)
    return PatientRead.model_validate(patient)


@router.get("/search", response_model=PatientSearchResult)
async def search_patients(
    db: DBDep,
    q: str = Query(min_length=2),
    limit: int = Query(20, ge=1, le=50),
    _user=Depends(require_roles(*VIEWER_ROLES)),
):
    """Búsqueda rápida de pacientes para autocompletar (por nombre, DNI o N° HC)."""
    service = PatientService(db)
    return await service.search_patients(q, limit)


@router.get("/", response_model=PatientList)
async def list_patients(
    db: DBDep,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    insurance_provider: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    _user=Depends(require_roles(*VIEWER_ROLES)),
):
    """Lista de pacientes con paginación y filtros."""
    service = PatientService(db)
    return await service.list_patients(page, size, search, insurance_provider, doctor_id)


@router.post("/", response_model=PatientCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    data: PatientCreate,
    db: DBDep,
    current_user=Depends(require_roles(*EDITOR_ROLES)),
):
    """Registra un nuevo paciente. Genera número de HC y usuario 'paciente' automáticamente."""
    service = PatientService(db)
    patient, temp_password = await service.create_patient(data, created_by_id=current_user.id)
    user_email = patient.email or f"{patient.dni}@paciente.local"
    response = PatientCreateResponse.model_validate(patient)
    if temp_password:
        response.temp_password = temp_password
        response.user_email = user_email
    return response


@router.get("/{patient_id}", response_model=PatientRead)
async def get_patient(
    patient_id: str,
    db: DBDep,
    current_user=Depends(get_current_user),
):
    """Obtiene los datos completos de un paciente."""
    # Pacientes solo pueden ver sus propios datos
    if "paciente" in current_user.role_names:
        # El user_id del paciente debe coincidir con el patient_id
        # En un flujo real se hace via patient.portal_user_id
        from app.exceptions import ForbiddenError
        raise ForbiddenError("Acceso denegado")

    service = PatientService(db)
    patient = await service.get_patient(patient_id)
    return PatientRead.model_validate(patient)


@router.patch("/{patient_id}", response_model=PatientRead)
async def update_patient(
    patient_id: str,
    data: PatientUpdate,
    db: DBDep,
    _user=Depends(require_roles(*EDITOR_ROLES)),
):
    """Actualiza datos del paciente (solo campos enviados)."""
    service = PatientService(db)
    patient = await service.update_patient(patient_id, data)
    return PatientRead.model_validate(patient)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,
    db: DBDep,
    _user=Depends(require_roles("admin")),
):
    """Soft-delete de un paciente. Solo admin."""
    service = PatientService(db)
    await service.soft_delete_patient(patient_id)
