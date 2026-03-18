"""Configuración del worker Celery para tareas asíncronas."""
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "hematologia_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.worker.tasks.notifications",
        "app.worker.tasks.reports",
        "app.worker.tasks.reminders",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone=settings.CLINIC_TIMEZONE,
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Retry automático
    task_default_retry_delay=60,
    task_max_retries=3,
    # Rutas de colas
    task_queues={
        "notifications": {"binding_key": "notifications"},
        "reports": {"binding_key": "reports"},
        "reminders": {"binding_key": "reminders"},
        "default": {"binding_key": "default"},
    },
    task_default_queue="default",
    # Beat schedule para tareas periódicas
    beat_schedule={
        "send-appointment-reminders": {
            "task": "app.worker.tasks.reminders.send_appointment_reminders",
            "schedule": 3600.0,  # Cada hora
        },
    },
)
