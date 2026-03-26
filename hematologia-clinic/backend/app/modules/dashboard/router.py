"""Dashboard: estadísticas y métricas del día."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.db.session import get_db
from app.dependencies import get_current_user
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.billing.models import Invoice, InvoiceStatus
from app.modules.dashboard.schemas import DashboardStats, TurnoResumen
from app.modules.patients.models import Patient
from app.modules.reports.models import Report

router = APIRouter(prefix="/v1/dashboard", tags=["Dashboard"])

SERVICE_TYPE_LABELS = {
    "consulta_medica": "Consulta médica",
    "hematologia": "Hematología",
    "coagulacion": "Coagulación",
    "puncion": "Punción",
    "laboratorio": "Laboratorio",
    "infusion": "Infusión",
}


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retorna las métricas del día para el dashboard principal."""
    settings = get_settings()
    tz = ZoneInfo(settings.CLINIC_TIMEZONE)
    now = datetime.now(tz)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    first_of_month = today_start.replace(day=1)

    # ─── Turnos de hoy (excluye cancelados) ───
    turnos_hoy = await db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.scheduled_at >= today_start,
            Appointment.scheduled_at < today_end,
            Appointment.deleted_at.is_(None),
            Appointment.status != AppointmentStatus.CANCELLED,
        )
    ) or 0

    # ─── Turnos pendientes/confirmados de hoy ───
    turnos_pendientes_hoy = await db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.scheduled_at >= today_start,
            Appointment.scheduled_at < today_end,
            Appointment.deleted_at.is_(None),
            Appointment.status.in_(
                [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
            ),
        )
    ) or 0

    # ─── Pacientes registrados (no eliminados) ───
    pacientes_activos = await db.scalar(
        select(func.count(Patient.id)).where(
            Patient.deleted_at.is_(None),
        )
    ) or 0

    # ─── Pacientes nuevos este mes ───
    pacientes_nuevos_mes = await db.scalar(
        select(func.count(Patient.id)).where(
            Patient.created_at >= first_of_month,
            Patient.deleted_at.is_(None),
        )
    ) or 0

    # ─── Informes en borrador (sin firmar) ───
    informes_borrador = await db.scalar(
        select(func.count(Report.id)).where(Report.status == "borrador")
    ) or 0

    # ─── Facturas pendientes ───
    facturas_pendientes = await db.scalar(
        select(func.count(Invoice.id)).where(
            Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.PARTIAL]),
            Invoice.deleted_at.is_(None),
        )
    ) or 0

    # ─── Monto pendiente de cobro ───
    monto_pendiente = await db.scalar(
        select(func.sum(Invoice.total - Invoice.paid_amount)).where(
            Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.PARTIAL]),
            Invoice.deleted_at.is_(None),
        )
    ) or 0.0

    # ─── Próximos turnos del día ───
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient))
        .where(
            Appointment.scheduled_at >= today_start,
            Appointment.scheduled_at < today_end,
            Appointment.deleted_at.is_(None),
            Appointment.status.not_in(
                [AppointmentStatus.CANCELLED, AppointmentStatus.ABSENT]
            ),
        )
        .order_by(Appointment.scheduled_at)
        .limit(6)
    )
    appointments = result.scalars().all()

    proximos_turnos = [
        TurnoResumen(
            id=str(a.id),
            hora=a.scheduled_at.astimezone(tz).strftime("%H:%M"),
            paciente=f"{a.patient.first_name} {a.patient.last_name}",
            tipo=SERVICE_TYPE_LABELS.get(a.service_type, a.service_type),
            status=a.status,
        )
        for a in appointments
    ]

    return DashboardStats(
        turnos_hoy=turnos_hoy,
        turnos_pendientes_hoy=turnos_pendientes_hoy,
        pacientes_activos=pacientes_activos,
        pacientes_nuevos_mes=pacientes_nuevos_mes,
        informes_borrador=informes_borrador,
        facturas_pendientes=facturas_pendientes,
        monto_pendiente=float(monto_pendiente),
        proximos_turnos=proximos_turnos,
    )
