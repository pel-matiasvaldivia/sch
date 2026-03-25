"""Lógica de negocio del módulo de informes."""
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.modules.patients.repository import PatientRepository
from app.modules.reports.models import Report
from app.modules.reports.repository import ReportRepository
from app.modules.reports.schemas import ReportCreate, ReportUpdate

# Transiciones válidas de estado
ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "borrador": ["firmado"],
    "firmado": ["entregado"],
    "entregado": [],
}


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ReportRepository(db)

    async def create_report(self, data: ReportCreate, created_by_id: str) -> Report:
        patient_repo = PatientRepository(self.db)
        patient = await patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise NotFoundError("Paciente", data.patient_id)

        report = Report(
            patient_id=data.patient_id,
            service_id=data.service_id,
            report_type=data.report_type,
            content=data.content or {},
            created_by_id=created_by_id,
            status="borrador",
        )
        return await self.repo.create(report)

    async def update_report(
        self, report_id: str, data: ReportUpdate, user_id: str
    ) -> Report:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise NotFoundError("Informe", report_id)

        if report.status != "borrador":
            raise ConflictError("Solo se pueden editar informes en borrador.")

        if data.content is not None:
            report.content = data.content
        if data.report_type is not None:
            report.report_type = data.report_type

        return await self.repo.save(report)

    async def sign_report(self, report_id: str, signed_by_id: str) -> Report:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise NotFoundError("Informe", report_id)

        if report.status != "borrador":
            raise ConflictError(
                f"No se puede firmar un informe en estado '{report.status}'."
            )

        report.status = "firmado"
        report.signed_by_id = signed_by_id
        report.signed_at = datetime.now(timezone.utc)
        return await self.repo.save(report)

    async def deliver_report(self, report_id: str) -> Report:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise NotFoundError("Informe", report_id)

        if report.status != "firmado":
            raise ConflictError(
                f"Solo se pueden entregar informes firmados (estado actual: '{report.status}')."
            )

        report.status = "entregado"
        report.notification_sent = True
        return await self.repo.save(report)

    async def delete_report(self, report_id: str) -> None:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise NotFoundError("Informe", report_id)
        if report.status != "borrador":
            raise ConflictError(
                "Solo se pueden eliminar informes en borrador."
            )
        await self.repo.delete(report)

    async def correct_report(
        self, report_id: str, data: ReportCreate, created_by_id: str
    ) -> Report:
        """Crea una nueva versión corregida de un informe firmado o entregado."""
        original = await self.repo.get_by_id(report_id)
        if not original:
            raise NotFoundError("Informe", report_id)

        if original.status == "borrador":
            raise ConflictError("Editá el informe en lugar de crear una corrección.")

        corrected = Report(
            patient_id=original.patient_id,
            service_id=original.service_id,
            report_type=original.report_type,
            content=data.content or original.content or {},
            created_by_id=created_by_id,
            status="borrador",
            version=original.version + 1,
            is_corrected=True,
            previous_version_id=original.id,
        )
        return await self.repo.create(corrected)
