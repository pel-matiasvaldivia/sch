"""
Middleware de auditoría.
Registra automáticamente todas las mutaciones (POST/PUT/PATCH/DELETE).
"""
import json
import time
from typing import Callable

from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware

from app.modules.audit.models import AuditLog


# Acciones que NO se auditan (rutas de solo lectura o internas)
SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc", "/favicon.ico"}
AUDIT_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


async def write_audit_log(
    db: AsyncSession,
    user_id: str | None,
    user_email: str | None,
    action: str,
    resource_type: str | None,
    resource_id: str | None,
    details: dict | None,
    ip_address: str | None,
    user_agent: str | None,
    success: bool = True,
    error_message: str | None = None,
) -> None:
    """Escribe un registro de auditoría. Se puede llamar directamente desde servicios."""
    log = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
        error_message=error_message,
    )
    db.add(log)
    # No hacemos flush aquí — se hace al final del request cycle


def _extract_resource_info(path: str, method: str) -> tuple[str | None, str | None]:
    """Extrae resource_type y resource_id desde la URL del request."""
    parts = [p for p in path.split("/") if p]

    # Mapeo de segmentos de URL a tipos de recursos
    resource_map = {
        "patients": "Patient",
        "users": "User",
        "appointments": "Appointment",
        "services": "Service",
        "reports": "Report",
        "invoices": "Invoice",
        "auth": "Auth",
    }

    resource_type = None
    resource_id = None

    for i, part in enumerate(parts):
        if part in resource_map:
            resource_type = resource_map[part]
            # El siguiente segmento puede ser el ID
            if i + 1 < len(parts) and not parts[i + 1].startswith("v"):
                resource_id = parts[i + 1]
            break

    return resource_type, resource_id


def _get_action(method: str, path: str) -> str:
    """Genera una acción descriptiva a partir del método HTTP y la ruta."""
    method_actions = {
        "POST": "CREATE",
        "PUT": "UPDATE",
        "PATCH": "UPDATE",
        "DELETE": "DELETE",
    }
    action = method_actions.get(method, method)

    # Acciones especiales
    if "login" in path:
        return "LOGIN"
    if "logout" in path:
        return "LOGOUT"
    if "change-password" in path:
        return "CHANGE_PASSWORD"
    if "refresh" in path:
        return "TOKEN_REFRESH"

    resource_type, _ = _extract_resource_info(path, method)
    if resource_type:
        return f"{action}_{resource_type.upper()}"
    return action
