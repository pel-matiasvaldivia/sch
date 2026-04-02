"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMyQueue, useUpdateAppointmentStatus, useUpdateAppointment, usePatientHistory } from "@/hooks/use-appointments";
import {
  type Appointment,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LOCATION_LABELS,
} from "@/types/appointments";

const SVC_LABELS = SERVICE_TYPE_LABELS;

const ACTIVE_STATUSES = ["pendiente", "confirmado", "presente", "en_progreso"];

function formatTime(isoString: string) {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const [notes, setNotes] = useState(appt.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const statusMutation = useUpdateAppointmentStatus(appt.id);
  const updateMutation = useUpdateAppointment(appt.id);

  const isInProgress = appt.status === "en_progreso";
  const { data: historyData } = usePatientHistory(isInProgress ? appt.patient_id : "");
  const priorHistory = historyData?.items.filter((h) => h.id !== appt.id) ?? [];

  const handleStart = async () => {
    try {
      await statusMutation.mutateAsync({ status: "en_progreso" });
      toast.success("Turno iniciado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al iniciar el turno");
    }
  };

  const handleConclude = async () => {
    try {
      if (notes !== (appt.notes ?? "")) {
        await updateMutation.mutateAsync({ notes });
      }
      await statusMutation.mutateAsync({ status: "concluido" });
      toast.success("Turno concluido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al concluir el turno");
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateMutation.mutateAsync({ notes });
      toast.success("Notas guardadas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar notas");
    } finally {
      setSavingNotes(false);
    }
  };

  const isTerminal = ["concluido", "cancelado", "ausente"].includes(appt.status);
  const canStart = ["pendiente", "confirmado", "presente"].includes(appt.status);

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
        isInProgress
          ? "border-purple-300 ring-1 ring-purple-200"
          : isTerminal
          ? "border-gray-200 opacity-70"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-mono font-bold text-gray-900">
            {formatTime(appt.scheduled_at)}
          </span>
          <span className="text-sm text-gray-500">{appt.duration_minutes} min</span>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_LABELS[appt.status] ?? appt.status}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Paciente */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-base leading-tight">
              {appt.patient?.full_name ?? "—"}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
              {appt.patient?.dni && <span>DNI {appt.patient.dni}</span>}
              {appt.patient?.medical_record_number && (
                <span>HC {appt.patient.medical_record_number}</span>
              )}
              {appt.patient?.phone && <span>{appt.patient.phone}</span>}
            </div>
          </div>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {SERVICE_TYPE_LABELS[appt.service_type] ?? appt.service_type}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {LOCATION_LABELS[appt.location] ?? appt.location}
          </div>
        </div>

        {/* Notas previas (no en progreso) */}
        {!isInProgress && appt.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <span className="font-medium text-gray-700">Notas: </span>
            {appt.notes}
          </div>
        )}

        {/* Área de notas cuando está en progreso */}
        {isInProgress && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Aclaraciones / Notas de la consulta
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Escribí observaciones, indicaciones o detalles de la consulta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 resize-none"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes || notes === (appt.notes ?? "")}
              className="text-xs text-purple-700 hover:text-purple-900 underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingNotes ? "Guardando..." : "Guardar notas"}
            </button>
          </div>
        )}

        {isInProgress && priorHistory.length > 0 && (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Consultas anteriores
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {priorHistory.map((h) => {
                const d = new Date(h.scheduled_at);
                return (
                  <div key={h.id} className="text-xs bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                      <span>{d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-gray-400">·</span>
                      <span>{SVC_LABELS[h.service_type] ?? h.service_type}</span>
                    </div>
                    {h.notes && (
                      <p className="text-gray-500 mt-1 leading-relaxed">{h.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones */}
        {!isTerminal && (
          <div className="flex gap-2 pt-1">
            {canStart && (
              <button
                type="button"
                onClick={handleStart}
                disabled={statusMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {statusMutation.isPending ? "Iniciando..." : "Iniciar consulta"}
              </button>
            )}
            {isInProgress && (
              <button
                type="button"
                onClick={handleConclude}
                disabled={statusMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {statusMutation.isPending ? "Concluyendo..." : "Concluir turno"}
              </button>
            )}
          </div>
        )}

        {isTerminal && (
          <p className="text-xs text-gray-400 text-center pt-1">
            Turno {STATUS_LABELS[appt.status]?.toLowerCase()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DoctorQueuePage() {
  const { data, isLoading, isError, refetch } = useMyQueue();

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const active = data?.items.filter((a) => ACTIVE_STATUSES.includes(a.status)) ?? [];
  const done = data?.items.filter((a) => !ACTIVE_STATUSES.includes(a.status)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cola del día</h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          No se pudo cargar la cola del día.
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {active.length === 0 && done.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No tenés turnos asignados para hoy</p>
            </div>
          )}

          {active.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Pendientes — {active.length} turno{active.length !== 1 ? "s" : ""}
              </h2>
              {active.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Finalizados — {done.length} turno{done.length !== 1 ? "s" : ""}
              </h2>
              {done.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
