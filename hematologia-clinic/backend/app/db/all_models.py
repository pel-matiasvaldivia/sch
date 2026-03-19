"""
Importa todos los modelos ORM en un solo lugar.
Esto permite que SQLAlchemy resuelva todas las relationships por string
antes de configurar los mappers.
Importar este módulo en main.py al inicio de la aplicación.
"""
from app.modules.users.models import User, Role, UserRole  # noqa: F401
from app.modules.patients.models import Patient  # noqa: F401
from app.modules.appointments.models import Appointment  # noqa: F401
from app.modules.services.models import MedicalService  # noqa: F401
from app.modules.reports.models import Report  # noqa: F401
from app.modules.billing.models import Invoice, InvoiceItem, Payment, InsuranceOrder  # noqa: F401
from app.modules.notifications.models import Notification  # noqa: F401
from app.modules.audit.models import AuditLog  # noqa: F401
