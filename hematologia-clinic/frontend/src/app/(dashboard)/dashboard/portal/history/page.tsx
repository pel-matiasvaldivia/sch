"use client";

import { useMyPatientProfile } from "@/hooks/use-patients";
import { usePatientHistory } from "@/hooks/use-appointments";
import {
  SERVICE_TYPE_LABELS,
  LOCATION_LABELS,
  type ServiceType,
  type AppointmentLocation,
} from "@/types/appointments";
import { formatDate, formatDNI, calculateAge, SEX_LABELS } from "@/lib/utils";

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export default function PortalHistoryPage() {
  const { data: patient, isLoading, isError } = useMyPatientProfile();
  const { data: historyData } = usePatientHistory(patient?.id ?? "");
  const history = historyData?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        No se pudo cargar tu historia clínica.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Historia Clínica</h1>
        <p className="text-muted-foreground text-sm mt-1">Tus datos clínicos y el historial de consultas</p>
      </div>

      {/* Header paciente */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
            {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{patient.full_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {SEX_LABELS[patient.sex]} · {calculateAge(patient.birth_date)} años
              </span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                HC {patient.medical_record_number}
              </span>
              {patient.blood_type && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                  {patient.blood_type}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Datos Personales</h3>
        <dl className="grid grid-cols-2 gap-4">
          <InfoItem label="DNI" value={formatDNI(patient.dni)} />
          <InfoItem label="Fecha de Nacimiento" value={formatDate(patient.birth_date)} />
          <InfoItem label="Teléfono" value={patient.phone} />
          <InfoItem label="Email" value={patient.email} />
          <InfoItem
            label="Dirección"
            value={[patient.address, patient.city, patient.province].filter(Boolean).join(", ")}
          />
        </dl>
      </div>

      {/* Cobertura */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Cobertura Médica</h3>
        <dl className="grid grid-cols-2 gap-4">
          <InfoItem label="Obra Social" value={patient.insurance_provider} />
          <InfoItem label="Plan" value={patient.insurance_plan} />
          <InfoItem label="N° Afiliado" value={patient.insurance_number} />
        </dl>
      </div>

      {/* Historial de consultas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Historial de Consultas
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {history.length} consulta{history.length !== 1 ? "s" : ""}
          </span>
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay consultas concluidas registradas
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((appt) => {
              const startDate = new Date(appt.scheduled_at);
              const endDate = appt.concluded_at ? new Date(appt.concluded_at) : null;
              return (
                <div key={appt.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {startDate.toLocaleDateString("es-AR", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      {SERVICE_TYPE_LABELS[appt.service_type as ServiceType] ?? appt.service_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {LOCATION_LABELS[appt.location as AppointmentLocation] ?? appt.location}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-2">
                    <span>
                      Inicio: {startDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {endDate && (
                      <span>
                        Fin: {endDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {appt.doctor?.full_name && (
                      <span>Dr./Dra. {appt.doctor.full_name}</span>
                    )}
                  </div>
                  {appt.notes && (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded p-2.5 border border-gray-100 leading-relaxed">
                      {appt.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
