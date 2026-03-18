"""Base declarativa de SQLAlchemy y metadata compartida."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Clase base para todos los modelos ORM del sistema."""
    pass


# Importar todos los modelos aquí para que Alembic los detecte en autogenerate
# Este archivo es el punto de importación central para las migraciones.
from app.modules.users.models import User, Role, UserRole  # noqa: F401, E402
from app.modules.patients.models import Patient  # noqa: F401, E402
from app.modules.appointments.models import Appointment  # noqa: F401, E402
from app.modules.services.models import MedicalService  # noqa: F401, E402
from app.modules.reports.models import Report  # noqa: F401, E402
from app.modules.billing.models import Invoice, InvoiceItem, Payment  # noqa: F401, E402
from app.modules.notifications.models import Notification  # noqa: F401, E402
from app.modules.audit.models import AuditLog  # noqa: F401, E402
