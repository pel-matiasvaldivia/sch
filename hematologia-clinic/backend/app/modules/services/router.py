"""Router de prestaciones médicas."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user, require_roles
from app.modules.services.schemas import (
    MedicalServiceCreate,
    MedicalServiceList,
    MedicalServiceRead,
    MedicalServiceUpdate,
)
from app.modules.services.service import MedicalServiceService

router = APIRouter(prefix="/v1/services", tags=["Prestaciones"])

DBDep = Annotated[AsyncSession, Depends(get_db)]


@router.get("/", response_model=MedicalServiceList)
async def list_services(
    db: DBDep,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    patient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    service_type: Optional[str] = Query(None),
    _user=Depends(require_roles("admin", "medico", "tecnico")),
):
    """Lista prestaciones con filtros opcionales."""
    svc = MedicalServiceService(db)
    return await svc.list_services(page, size, patient_id, status, service_type)


@router.post("/", response_model=MedicalServiceRead, status_code=status.HTTP_201_CREATED)
async def create_service(
    data: MedicalServiceCreate,
    db: DBDep,
    current_user=Depends(require_roles("admin", "medico", "tecnico")),
):
    """Crea una nueva prestación."""
    svc = MedicalServiceService(db)
    service = await svc.create_service(data, requested_by_id=current_user.id)
    return MedicalServiceRead.model_validate(service)


@router.get("/{service_id}", response_model=MedicalServiceRead)
async def get_service(
    service_id: str,
    db: DBDep,
    _user=Depends(require_roles("admin", "medico", "tecnico")),
):
    """Obtiene una prestación por ID."""
    svc = MedicalServiceService(db)
    service = await svc.get_service(service_id)
    return MedicalServiceRead.model_validate(service)


@router.patch("/{service_id}", response_model=MedicalServiceRead)
async def update_service(
    service_id: str,
    data: MedicalServiceUpdate,
    db: DBDep,
    _user=Depends(require_roles("admin", "medico", "tecnico")),
):
    """Actualiza estado u observaciones de una prestación."""
    svc = MedicalServiceService(db)
    service = await svc.update_service(service_id, data)
    return MedicalServiceRead.model_validate(service)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    db: DBDep,
    _user=Depends(require_roles("admin")),
):
    """Soft-delete de una prestación. Solo admin."""
    svc = MedicalServiceService(db)
    await svc.delete_service(service_id)
