"""Tareas de recordatorios: turnos próximos."""
import logging
from datetime import datetime, timedelta, timezone

from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.worker.tasks.reminders.send_appointment_reminders",
    queue="reminders",
)
def send_appointment_reminders() -> dict:
    """
    Tarea periódica: busca turnos en las próximas 24hs que no tengan recordatorio enviado
    y envía notificación por email y WhatsApp.
    """
    import asyncio
    from sqlalchemy import select, and_

    async def _run():
        from app.db.session import AsyncSessionLocal
        from app.modules.appointments.models import Appointment, AppointmentStatus

        now = datetime.now(timezone.utc)
        reminder_window_start = now + timedelta(hours=23)
        reminder_window_end = now + timedelta(hours=25)

        async with AsyncSessionLocal() as db:
            stmt = select(Appointment).where(
                and_(
                    Appointment.scheduled_at >= reminder_window_start,
                    Appointment.scheduled_at <= reminder_window_end,
                    Appointment.status.in_([
                        AppointmentStatus.PENDING,
                        AppointmentStatus.CONFIRMED,
                    ]),
                    Appointment.reminder_sent == False,
                    Appointment.deleted_at.is_(None),
                )
            )
            result = await db.execute(stmt)
            appointments = result.scalars().all()

            sent_count = 0
            for appt in appointments:
                try:
                    # Obtener paciente y médico
                    from app.modules.patients.models import Patient
                    patient_stmt = select(Patient).where(Patient.id == appt.patient_id)
                    patient_result = await db.execute(patient_stmt)
                    patient = patient_result.scalar_one_or_none()

                    if patient:
                        # Encolar notificación email
                        if patient.email:
                            from app.worker.tasks.notifications import send_email_notification
                            scheduled_str = appt.scheduled_at.strftime("%d/%m/%Y a las %H:%M")
                            send_email_notification.delay(
                                to_email=patient.email,
                                subject=f"Recordatorio de turno — {scheduled_str}",
                                body_html=f"""
                                <p>Estimado/a {patient.full_name},</p>
                                <p>Le recordamos que tiene un turno programado para
                                <strong>{scheduled_str}</strong>.</p>
                                <p>Tipo: {appt.service_type}</p>
                                <p>Si no puede asistir, por favor comuníquese con nosotros.</p>
                                """,
                            )

                        # Encolar notificación WhatsApp
                        if patient.phone:
                            from app.worker.tasks.notifications import send_whatsapp_notification
                            send_whatsapp_notification.delay(
                                phone_number=patient.phone,
                                template_name="appointment_reminder",
                                template_params=[
                                    patient.first_name,
                                    appt.scheduled_at.strftime("%d/%m/%Y"),
                                    appt.scheduled_at.strftime("%H:%M"),
                                ],
                            )

                    # Marcar recordatorio como enviado
                    appt.reminder_sent = True
                    sent_count += 1

                except Exception as e:
                    logger.error(f"Error procesando recordatorio para turno {appt.id}: {e}")

            await db.commit()
            return sent_count

    count = asyncio.run(_run())
    logger.info(f"Recordatorios enviados: {count}")
    return {"sent": count}
