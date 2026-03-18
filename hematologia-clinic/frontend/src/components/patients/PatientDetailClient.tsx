"use client";

import Link from "next/link";
import { usePatient } from "@/hooks/use-patients";
import { formatDate, formatDNI, calculateAge, SEX_LABELS } from "@/lib/utils";

interface Props {
  patientId: string;
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export function PatientDetailClient({ patientId }: Props) {
  const { data: patient, isLoading, error } = usePatient(patientId);

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

  if (error || !patient) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        No se pudo cargar la historia clínica.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del paciente */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{patient.full_name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground">
                  {SEX_LABELS[patient.sex]} · {calculateAge(patient.birth_date)} años
                </span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  {patient.medical_record_number}
                </span>
                {patient.blood_type && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                    {patient.blood_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/dashboard/patients/${patient.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
            <Link
              href={`/dashboard/appointments/new?patient_id=${patient.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Turno
            </Link>
          </div>
        </div>
      </div>

      {/* Datos del paciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Datos Personales</h3>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label="DNI" value={formatDNI(patient.dni)} />
            <InfoItem label="Fecha de Nacimiento" value={formatDate(patient.birth_date)} />
            <InfoItem label="Sexo" value={SEX_LABELS[patient.sex]} />
            <InfoItem label="Grupo Sanguíneo" value={patient.blood_type} />
          </dl>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Contacto</h3>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label="Teléfono" value={patient.phone} />
            <InfoItem label="Email" value={patient.email} />
            <InfoItem label="Dirección" value={[patient.address, patient.city, patient.province].filter(Boolean).join(", ")} />
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

        {/* Contacto de emergencia */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
          <dl className="grid grid-cols-2 gap-4">
            <InfoItem label="Nombre" value={patient.emergency_contact_name} />
            <InfoItem label="Teléfono" value={patient.emergency_contact_phone} />
            <InfoItem label="Relación" value={patient.emergency_contact_relationship} />
          </dl>
        </div>
      </div>

      {/* Historial (placeholder) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Historial de Prestaciones</h3>
        <div className="text-center py-8 text-muted-foreground text-sm">
          <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          El historial de prestaciones se mostrará aquí cuando se implemente el módulo de Prestaciones.
        </div>
      </div>
    </div>
  );
}
