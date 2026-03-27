"""Lógica de negocio para prestaciones médicas."""
import math
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, NotFoundError, ValidationError
from app.modules.services.models import MedicalService, ServiceStatus
from app.modules.services.repository import MedicalServiceRepository
from app.modules.services.schemas import (
    MedicalServiceCreate,
    MedicalServiceList,
    MedicalServiceRead,
    MedicalServiceUpdate,
)
from app.modules.patients.repository import PatientRepository

ALLOWED_TRANSITIONS = {
    ServiceStatus.REQUESTED: {ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED},
    ServiceStatus.IN_PROGRESS: {ServiceStatus.VALIDATION_PENDING, ServiceStatus.CANCELLED},
    ServiceStatus.VALIDATION_PENDING: {ServiceStatus.COMPLETED, ServiceStatus.CANCELLED},
    ServiceStatus.COMPLETED: set(),
    ServiceStatus.CANCELLED: set(),
}


class MedicalServiceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = MedicalServiceRepository(db)

    async def create_service(
        self, data: MedicalServiceCreate, requested_by_id: str
    ) -> MedicalService:
        patient_repo = PatientRepository(self.db)
        patient = await patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise NotFoundError("Paciente", data.patient_id)

        # Validar appointment_id si se proporcionó
        if data.appointment_id:
            from app.modules.appointments.repository import AppointmentRepository
            appt_repo = AppointmentRepository(self.db)
            appt = await appt_repo.get_by_id(data.appointment_id)
            if not appt:
                raise NotFoundError("Turno", data.appointment_id)

        service = MedicalService(
            patient_id=data.patient_id,
            appointment_id=data.appointment_id,
            requested_by_id=requested_by_id,
            service_type=data.service_type,
            status=ServiceStatus.REQUESTED.value,
            location=data.location,
            clinical_observations=data.clinical_observations,
            service_data=data.service_data or {},
        )
        return await self.repo.create(service)

    async def get_service(self, service_id: str) -> MedicalService:
        service = await self.repo.get_by_id(service_id)
        if not service:
            raise NotFoundError("Prestación", service_id)
        return service

    async def update_service(
        self, service_id: str, data: MedicalServiceUpdate, user_id: Optional[str] = None
    ) -> MedicalService:
        service = await self.repo.get_by_id(service_id)
        if not service:
            raise NotFoundError("Prestación", service_id)

        if service.status in (ServiceStatus.COMPLETED.value, ServiceStatus.CANCELLED.value):
            raise ConflictError(
                f"No se puede modificar una prestación en estado '{service.status}'"
            )

        update_data = data.model_dump(exclude_unset=True)

        if "status" in update_data:
            current = ServiceStatus(service.status)
            new_status = ServiceStatus(update_data["status"])
            allowed = ALLOWED_TRANSITIONS.get(current, set())
            if new_status not in allowed:
                raise ConflictError(
                    f"Transición de '{current.value}' a '{new_status.value}' no permitida"
                )
            if new_status == ServiceStatus.IN_PROGRESS and not update_data.get("performed_by_id") and not service.performed_by_id:
                raise ValidationError("Se requiere indicar quién realiza la prestación")
            if new_status == ServiceStatus.COMPLETED:
                service.performed_at = service.performed_at or datetime.now(timezone.utc)
                # Trigger automático de facturación
                from app.modules.billing.service import BillingService
                from app.modules.billing.schemas import InvoiceCreate
                billing_service = BillingService(self.db)
                invoice_data = InvoiceCreate(
                    patient_id=service.patient_id,
                    issue_date=datetime.now(timezone.utc).date(),
                    notes=f"Factura generada automáticamente por validación de prestación {service.id}.",
                    items=[{
                        "service_id": service.id,
                        "description": f"Servicio realizado: {service.service_type}",
                        "quantity": 1,
                        "unit_price": 0.0
                    }]
                )
                await billing_service.create_invoice(invoice_data, "system_auto")

                # Trigger automático de informe médico
                from app.modules.reports.service import ReportService
                from app.modules.reports.schemas import ReportCreate
                report_svc = ReportService(self.db)
                report_data = ReportCreate(
                    patient_id=service.patient_id,
                    service_id=service.id,
                    report_type="laboratorio",  # Por defecto laboratorio para estas prestaciones
                    content={
                        "resultados": service.service_data.get("resultados_analiticos", {}),
                        "observaciones": service.clinical_observations,
                        "conclusiones": service.service_data.get("conclusiones_medicas", "")
                    }
                )
                report = await report_svc.create_report(report_data, user_id or "system_auto")
                # Firmar el informe automáticamente
                await report_svc.sign_report(report.id, user_id or str(service.performed_by_id))

        for field, value in update_data.items():
            setattr(service, field, value)

        await self.db.flush()
        return await self.repo.get_by_id(service_id)

    async def list_services(
        self,
        page: int = 1,
        size: int = 20,
        patient_id: Optional[str] = None,
        status: Optional[str] = None,
        service_type: Optional[str] = None,
    ) -> MedicalServiceList:
        services, total = await self.repo.list_paginated(
            page, size, patient_id, status, service_type
        )
        pages = math.ceil(total / size) if size > 0 else 0
        return MedicalServiceList(
            items=[MedicalServiceRead.model_validate(s) for s in services],
            total=total,
            page=page,
            size=size,
            pages=pages,
        )

    async def delete_service(self, service_id: str) -> None:
        service = await self.repo.get_by_id(service_id)
        if not service:
            raise NotFoundError("Prestación", service_id)
        await self.repo.soft_delete(service)
