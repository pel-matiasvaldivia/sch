"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReport, useUpdateReport } from "@/hooks/use-reports";
import { REPORT_TYPE_LABELS } from "@/types/reports";

interface Props {
  id: string;
}

export function ReportEditClient({ id }: Props) {
  const router = useRouter();
  const { data: report, isLoading } = useReport(id);
  const update = useUpdateReport(id);

  const [reportType, setReportType] = useState("");
  const [text, setText] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (report && !initialized) {
      setReportType(report.report_type);
      setText(report.content?.text ?? "");
      setInitialized(true);
    }
  }, [report, initialized]);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  }

  if (!report) {
    return <div className="text-center py-12 text-red-500 text-sm">Informe no encontrado.</div>;
  }

  if (report.status !== "borrador") {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Solo se pueden editar informes en borrador. Este informe está en estado{" "}
        <span className="font-medium">{report.status}</span>.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      { report_type: reportType, content: { text } },
      { onSuccess: () => router.push(`/dashboard/reports/${id}`) }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info del paciente (solo lectura) */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
        Paciente:{" "}
        <span className="font-medium text-gray-900">{report.patient?.full_name}</span>
        {" · "}
        {report.patient?.medical_record_number}
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de informe
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {Object.entries(REPORT_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contenido del informe
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
        />
      </div>

      {update.error && (
        <p className="text-sm text-red-600">
          {update.error instanceof Error ? update.error.message : "Error al guardar"}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={update.isPending}
          className="flex-1 sm:flex-none bg-primary text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {update.isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
