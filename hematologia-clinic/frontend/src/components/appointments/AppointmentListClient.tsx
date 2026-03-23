"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAppointments, useUpdateAppointmentStatus, useDeleteAppointment } from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import { AccessDenied } from "@/components/ui/AccessDenied";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SERVICE_TYPE_LABELS,
  LOCATION_LABELS,
  type Appointment,
  type AppointmentStatus,
} from "@/types/appointments";

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pendiente: ["confirmado", "ausente", "cancelado"],
  confirmado: ["presente", "en_progreso", "ausente", "cancelado"],
  presente: ["en_progreso"],
  en_progreso: ["presente", "ausente", "concluido"],
  ausente: [],
  cancelado: [],
  concluido: [],
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

interface StatusMenuProps {
  appointment: Appointment;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

function StatusMenu({ appointment, openId, setOpenId }: StatusMenuProps) {
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateStatus = useUpdateAppointmentStatus(appointment.id);

  const isOpen = openId === appointment.id;
  const transitions = STATUS_TRANSITIONS[appointment.status as AppointmentStatus] ?? [];

  // Cerrar al clickear afuera
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpenId(null);
        setShowCancelInput(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpenId]);

  const handleOpen = () => {
    if (isOpen) { setOpenId(null); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Si hay poco espacio abajo, abrir hacia arriba
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = showCancelInput ? 110 : transitions.length * 36 + 16;
      const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
      setMenuPos({ top, left: rect.left });
    }
    setOpenId(appointment.id);
  };

  const handleTransition = async (newStatus: AppointmentStatus) => {
    if (newStatus === "cancelado") { setShowCancelInput(true); return; }
    const confirmMsg = `¿Cambiar estado a "${STATUS_LABELS[newStatus]}"?`;
    if (!confirm(confirmMsg)) return;
    try {
      await updateStatus.mutateAsync({ status: newStatus });
      toast.success("Estado actualizado");
      setOpenId(null);
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  };

  const handleCancel = async () => {
    try {
      await updateStatus.mutateAsync({ status: "cancelado", cancellation_reason: cancellationReason });
      toast.success("Turno cancelado");
      setOpenId(null);
      setShowCancelInput(false);
    } catch {
      toast.error("No se pudo cancelar el turno");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <StatusBadge status={appointment.status as AppointmentStatus} />
      {transitions.length > 0 && (
        <button
          ref={btnRef}
          onClick={handleOpen}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Cambiar estado"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {isOpen && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 50 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[160px]"
        >
          {showCancelInput ? (
            <div className="space-y-2">
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Motivo (opcional)"
                rows={2}
                className="w-full text-xs border border-gray-300 rounded p-1 resize-none"
              />
              <div className="flex gap-1">
                <button onClick={handleCancel} className="flex-1 text-xs bg-red-500 text-white rounded py-1 hover:bg-red-600">
                  Confirmar
                </button>
                <button onClick={() => { setShowCancelInput(false); setOpenId(null); }} className="flex-1 text-xs border border-gray-300 rounded py-1 hover:bg-gray-50">
                  Volver
                </button>
              </div>
            </div>
          ) : (
            transitions.map((s) => (
              <button
                key={s}
                onClick={() => handleTransition(s)}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[s].split(" ")[0]}`} />
                {STATUS_LABELS[s]}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AppointmentListClient() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading, error } = useAppointments({
    page,
    size: 20,
    status: statusFilter || undefined,
    service_type: serviceFilter || undefined,
  });

  const deleteMutation = useDeleteAppointment();

  const handleDelete = async (appt: Appointment) => {
    if (!confirm(`¿Eliminar el turno de ${appt.patient?.full_name ?? "este paciente"}?`)) return;
    try {
      await deleteMutation.mutateAsync(appt.id);
      toast.success("Turno eliminado");
    } catch {
      toast.error("No se pudo eliminar el turno");
    }
  };

  if (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <AccessDenied section="los turnos" />;
    }
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Error al cargar los turnos. Intente nuevamente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="presente">Presente</option>
          <option value="en_progreso">En Progreso</option>
          <option value="concluido">Concluido</option>
          <option value="ausente">Ausente</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <select
          value={serviceFilter}
          onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Todos los servicios</option>
          <option value="consulta_medica">Consulta Médica</option>
          <option value="hematologia">Hematología</option>
          <option value="coagulacion">Coagulación</option>
          <option value="puncion">Punción</option>
          <option value="laboratorio">Laboratorio</option>
          <option value="infusion">Infusión</option>
        </select>

        {(statusFilter || serviceFilter) && (
          <button
            onClick={() => { setStatusFilter(""); setServiceFilter(""); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-sm">No hay turnos registrados</p>
            <Link href="/dashboard/appointments/new" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">
              Crear primer turno →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha y hora</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Médico</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Servicio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ubicación</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map((appt) => (
                <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                    {formatDateTime(appt.scheduled_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{appt.patient?.full_name ?? "—"}</span>
                    {appt.patient?.dni && (
                      <span className="block text-xs text-gray-500">DNI {appt.patient.dni}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{appt.doctor?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {SERVICE_TYPE_LABELS[appt.service_type as keyof typeof SERVICE_TYPE_LABELS] ?? appt.service_type}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {LOCATION_LABELS[appt.location as keyof typeof LOCATION_LABELS] ?? appt.location}
                  </td>
                  <td className="px-4 py-3">
                    <StatusMenu appointment={appt} openId={openMenuId} setOpenId={setOpenMenuId} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(appt)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar turno"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-muted-foreground">
              Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} de {data.total} turnos
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
                {page} / {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
