"use client";

import { useMyAppointments } from "@/hooks/use-appointments";
import {
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LOCATION_LABELS,
  type AppointmentStatus,
  type ServiceType,
  type AppointmentLocation,
} from "@/types/appointments";

const UPCOMING_STATUSES: AppointmentStatus[] = ["pendiente", "confirmado"];
const PAST_STATUSES: AppointmentStatus[] = ["presente", "en_progreso", "concluido", "ausente", "cancelado"];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

export default function PortalAppointmentsPage() {
  const { data, isLoading, isError } = useMyAppointments();

  const upcoming = data?.items.filter((a) => UPCOMING_STATUSES.includes(a.status as AppointmentStatus)) ?? [];
  const past = data?.items.filter((a) => PAST_STATUSES.includes(a.status as AppointmentStatus)) ?? [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Turnos</h1>
        <p className="text-muted-foreground text-sm mt-1">Tus turnos médicos programados</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          No se pudieron cargar tus turnos.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Próximos — {upcoming.length} turno{upcoming.length !== 1 ? "s" : ""}
            </h2>

            {upcoming.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-muted-foreground">No tenés turnos pendientes</p>
              </div>
            ) : (
              upcoming.map((appt) => {
                const { date, time } = formatDateTime(appt.scheduled_at);
                return (
                  <div key={appt.id} className="bg-white rounded-xl border border-blue-200 ring-1 ring-blue-50 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[appt.status as AppointmentStatus]}`}>
                            {STATUS_LABELS[appt.status as AppointmentStatus]}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{date}</p>
                          <p className="text-2xl font-bold text-blue-600">{time}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span>{SERVICE_TYPE_LABELS[appt.service_type as ServiceType] ?? appt.service_type}</span>
                          <span>{LOCATION_LABELS[appt.location as AppointmentLocation] ?? appt.location}</span>
                          {appt.duration_minutes && (
                            <span>{appt.duration_minutes} min</span>
                          )}
                        </div>
                        {appt.doctor?.full_name && (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Profesional:</span> Dr./Dra. {appt.doctor.full_name}
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <span className="font-medium">Indicaciones:</span> {appt.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Historial — {past.length} turno{past.length !== 1 ? "s" : ""}
              </h2>
              {past.map((appt) => {
                const { date, time } = formatDateTime(appt.scheduled_at);
                return (
                  <div key={appt.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm opacity-80">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-700 capitalize">{date}</span>
                          <span className="text-sm text-gray-500">— {time}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          <span>{SERVICE_TYPE_LABELS[appt.service_type as ServiceType] ?? appt.service_type}</span>
                          {appt.doctor?.full_name && <span>Dr./Dra. {appt.doctor.full_name}</span>}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[appt.status as AppointmentStatus]}`}>
                        {STATUS_LABELS[appt.status as AppointmentStatus]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}
