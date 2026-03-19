import type { Metadata } from "next";
import Link from "next/link";
import { PatientForm } from "@/components/patients/PatientForm";

export const metadata: Metadata = { title: "Nuevo Paciente" };

export default function NewPatientPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/patients"
          className="text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h1>
          <p className="text-muted-foreground">Registrar nueva historia clínica</p>
        </div>
      </div>

      <PatientForm mode="create" />
    </div>
  );
}
