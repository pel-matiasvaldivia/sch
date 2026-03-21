"use client";

import { usePatient } from "@/hooks/use-patients";
import { PatientForm } from "@/components/patients/PatientForm";

interface Props {
  patientId: string;
}

export function EditPatientClient({ patientId }: Props) {
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
        No se pudo cargar los datos del paciente.
      </div>
    );
  }

  return <PatientForm mode="edit" patient={patient} />;
}
