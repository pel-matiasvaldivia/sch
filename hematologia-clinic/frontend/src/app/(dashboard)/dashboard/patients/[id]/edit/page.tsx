import type { Metadata } from "next";
import Link from "next/link";
import { EditPatientClient } from "@/components/patients/EditPatientClient";

export const metadata: Metadata = { title: "Editar Paciente" };

interface Props {
  params: { id: string };
}

export default function EditPatientPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/patients/${params.id}`}
          className="text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Modificá los datos del paciente</p>
        </div>
      </div>

      <EditPatientClient patientId={params.id} />
    </div>
  );
}
