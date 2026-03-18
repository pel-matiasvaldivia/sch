"""Tareas de notificación: email y WhatsApp."""
import asyncio
import logging

from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.worker.tasks.notifications.send_email_notification",
    queue="notifications",
    bind=True,
    max_retries=3,
)
def send_email_notification(self, to_email: str, subject: str, body_html: str) -> dict:
    """Envía un email de notificación al paciente o usuario."""
    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        from app.config import get_settings
        settings = get_settings()

        async def _send():
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            msg.attach(MIMEText(body_html, "html"))

            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=False,
                start_tls=True,
            )

        asyncio.run(_send())
        logger.info(f"Email enviado a {to_email}: {subject}")
        return {"status": "sent", "to": to_email}

    except Exception as exc:
        logger.error(f"Error enviando email a {to_email}: {exc}")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@celery_app.task(
    name="app.worker.tasks.notifications.send_whatsapp_notification",
    queue="notifications",
    bind=True,
    max_retries=3,
)
def send_whatsapp_notification(
    self, phone_number: str, template_name: str, template_params: list
) -> dict:
    """Envía un mensaje WhatsApp via WhatsApp Business API."""
    try:
        import httpx
        from app.config import get_settings
        settings = get_settings()

        if not settings.FEATURE_WHATSAPP:
            return {"status": "skipped", "reason": "WhatsApp feature disabled"}

        async def _send():
            url = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
            payload = {
                "messaging_product": "whatsapp",
                "to": phone_number,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": "es_AR"},
                    "components": [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": p} for p in template_params
                            ],
                        }
                    ],
                },
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"},
                )
                response.raise_for_status()
                return response.json()

        result = asyncio.run(_send())
        logger.info(f"WhatsApp enviado a {phone_number}: template {template_name}")
        return {"status": "sent", "to": phone_number, "result": result}

    except Exception as exc:
        logger.error(f"Error enviando WhatsApp a {phone_number}: {exc}")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
