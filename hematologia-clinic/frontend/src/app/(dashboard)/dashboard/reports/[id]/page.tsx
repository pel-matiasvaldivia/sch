import type { Metadata } from "next";
import Link from "next/link";
import { ReportDetailClient } from "@/components/reports/ReportDetailClient";

export const metadata: Metadata = { title: "Informe" };

interface Props {
  params: { id: string };
}

export default function ReportDetailPage({ params }: Props) {
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
        <h1 className="text-2xl font-bold text-gray-900">Detalle de Informe</h1>
      </div>
      <ReportDetailClient id={params.id} />
    </div>
  );
}
