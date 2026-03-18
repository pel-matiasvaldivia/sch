import type { Metadata } from "next";
import Link from "next/link";
import { PatientDetailClient } from "@/components/patients/PatientDetailClient";

export const metadata: Metadata = { title: "Detalle Paciente" };

interface Props {
  params: { id: string };
}

export default function PatientDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/patients"
          className="text-muted-foreground hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Historia Clínica</h1>
      </div>

      <PatientDetailClient patientId={params.id} />
    </div>
  );
}
