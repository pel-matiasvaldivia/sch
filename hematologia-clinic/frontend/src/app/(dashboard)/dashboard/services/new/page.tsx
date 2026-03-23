import type { Metadata } from "next";
import Link from "next/link";
import { ServiceForm } from "@/components/services/ServiceForm";

export const metadata: Metadata = { title: "Nueva Prestación" };

interface Props {
  searchParams: { patient_id?: string };
}

export default function NewServicePage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/services"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Prestación</h1>
          <p className="text-muted-foreground">Registrá un nuevo servicio médico</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <ServiceForm defaultPatientId={searchParams.patient_id} />
      </div>
    </div>
  );
}
