"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppointment } from "@/hooks/use-appointments";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { STATUS_LABELS } from "@/types/appointments";

const NON_EDITABLE_STATUSES = ["cancelado", "ausente", "concluido"];

export default function EditAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: appointment, isLoading, isError } = useAppointment(id);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">No se pudo cargar el turno.</p>
      </div>
    );
  }

  if (NON_EDITABLE_STATUSES.includes(appointment.status)) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-900">
              Este turno no se puede editar
            </p>
            <p className="text-sm text-amber-700 mt-1">
              El turno tiene estado <strong>{STATUS_LABELS[appointment.status]}</strong> y ya no admite modificaciones.
            </p>
            <button
              onClick={() => router.push("/dashboard/appointments")}
              className="mt-3 text-sm text-amber-800 underline hover:no-underline"
            >
              Volver a turnos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/appointments")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a turnos
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Editar Turno</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paciente: <span className="font-medium text-gray-700">{appointment.patient.full_name}</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <AppointmentForm mode="edit" appointment={appointment} />
      </div>
    </div>
  );
}
