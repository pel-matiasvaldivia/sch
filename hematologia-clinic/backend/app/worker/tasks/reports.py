"""Tareas de generación de informes PDF."""
import logging

from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.worker.tasks.reports.generate_report_pdf",
    queue="reports",
    bind=True,
    max_retries=3,
)
def generate_report_pdf(self, report_id: str) -> dict:
    """
    Genera el PDF de un informe médico y lo sube a MinIO.
    Se implementará en Fase 2 junto con el módulo de informes.
    """
    # TODO: Implementar generación de PDF con ReportLab en Fase 2
    logger.info(f"Generación de PDF pendiente para informe {report_id}")
    return {"status": "pending", "report_id": report_id}
