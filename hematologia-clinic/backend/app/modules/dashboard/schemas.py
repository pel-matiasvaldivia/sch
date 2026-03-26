"""Schemas del dashboard."""
from typing import List

from pydantic import BaseModel


class TurnoResumen(BaseModel):
    id: str
    hora: str
    paciente: str
    tipo: str
    status: str


class DashboardStats(BaseModel):
    turnos_hoy: int
    turnos_pendientes_hoy: int
    pacientes_activos: int
    pacientes_nuevos_mes: int
    informes_borrador: int
    facturas_pendientes: int
    monto_pendiente: float
    proximos_turnos: List[TurnoResumen]
