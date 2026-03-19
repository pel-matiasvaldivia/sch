"""Base declarativa de SQLAlchemy y metadata compartida."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Clase base para todos los modelos ORM del sistema."""
    pass
