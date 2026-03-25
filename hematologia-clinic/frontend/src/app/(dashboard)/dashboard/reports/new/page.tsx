import type { Metadata } from "next";
import Link from "next/link";
import { ReportForm } from "@/components/reports/ReportForm";

export const metadata: Metadata = { title: "Nuevo Informe" };

interface Props {
  searchParams: { patient_id?: string };
}

export default function NewReportPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/reports"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Informe</h1>
          <p className="text-muted-foreground">Creá un nuevo informe médico en borrador</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <ReportForm defaultPatientId={searchParams.patient_id} />
      </div>
    </div>
  );
}
