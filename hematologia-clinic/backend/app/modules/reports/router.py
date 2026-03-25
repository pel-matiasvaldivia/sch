"""Router de informes médicos."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import require_roles
from app.exceptions import NotFoundError
from app.modules.reports.repository import ReportRepository
from app.modules.reports.schemas import (
    ReportCreate,
    ReportList,
    ReportRead,
    ReportUpdate,
)
from app.modules.reports.service import ReportService
from app.modules.users.models import User

router = APIRouter(prefix="/v1/reports", tags=["Informes"])


@router.get("/", response_model=ReportList)
async def list_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico", "tecnico")),
):
    repo = ReportRepository(db)
    items, total = await repo.list_paginated(
        page=page, size=size,
        patient_id=patient_id, status=status, report_type=report_type,
        search=search,
    )
    return ReportList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 0,
    )


@router.post("/", response_model=ReportRead, status_code=201)
async def create_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico", "tecnico")),
):
    service = ReportService(db)
    report = await service.create_report(data, str(current_user.id))
    await db.commit()
    return report


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico", "tecnico")),
):
    repo = ReportRepository(db)
    report = await repo.get_by_id(report_id)
    if not report:
        raise NotFoundError("Informe", report_id)
    return report


@router.patch("/{report_id}", response_model=ReportRead)
async def update_report(
    report_id: str,
    data: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico", "tecnico")),
):
    service = ReportService(db)
    report = await service.update_report(report_id, data, str(current_user.id))
    await db.commit()
    return report


@router.post("/{report_id}/sign", response_model=ReportRead)
async def sign_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico")),
):
    service = ReportService(db)
    report = await service.sign_report(report_id, str(current_user.id))
    await db.commit()
    return report


@router.post("/{report_id}/deliver", response_model=ReportRead)
async def deliver_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico", "tecnico")),
):
    service = ReportService(db)
    report = await service.deliver_report(report_id)
    await db.commit()
    return report


@router.post("/{report_id}/correct", response_model=ReportRead, status_code=201)
async def correct_report(
    report_id: str,
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico")),
):
    service = ReportService(db)
    report = await service.correct_report(report_id, data, str(current_user.id))
    await db.commit()
    return report


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "medico")),
):
    service = ReportService(db)
    await service.delete_report(report_id)
    await db.commit()


@router.get("/public/{access_token}", response_model=ReportRead, include_in_schema=False)
async def get_report_by_token(
    access_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Acceso público al informe mediante token (sin autenticación)."""
    repo = ReportRepository(db)
    report = await repo.get_by_access_token(access_token)
    if not report:
        raise NotFoundError("Informe", access_token)
    return report
