"use client";

import { useState } from "react";
import Link from "next/link";
import { useReport, useSignReport, useDeliverReport, useUpdateReport } from "@/hooks/use-reports";
import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  type ReportStatus,
} from "@/types/reports";
import { ReportPrintView } from "./ReportPrintView";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

function ConfirmModal({ title, description, confirmLabel, confirmClass = "bg-primary text-white hover:bg-primary/90", onConfirm, onClose, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${confirmClass}`}>
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props { id: string }

export function ReportDetailClient({ id }: Props) {
  const { data: report, isLoading, error } = useReport(id);
  const sign = useSignReport(id);
  const deliver = useDeliverReport(id);
  const update = useUpdateReport(id);

  const [confirm, setConfirm] = useState<"sign" | "deliver" | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  if (error || !report) return <div className="text-center py-12 text-red-500 text-sm">No se encontró el informe.</div>;

  const statusColor = REPORT_STATUS_COLORS[report.status as ReportStatus] ?? "";
  const statusLabel = REPORT_STATUS_LABELS[report.status as ReportStatus] ?? report.status;

  function startEdit() {
    setEditText(report!.content?.text ?? "");
    setEditing(true);
  }

  function saveEdit() {
    update.mutate(
      { content: { text: editText } },
      { onSuccess: () => setEditing(false) }
    );
  }

  function handlePrint() {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  }

  return (
    <div className="space-y-6">
      {confirm === "sign" && (
        <ConfirmModal
          title="¿Firmar informe?"
          description="Una vez firmado no podrá editarse. Solo podrá crearse una corrección posterior."
          confirmLabel="Firmar informe"
          confirmClass="bg-blue-600 text-white hover:bg-blue-700"
          onConfirm={() => sign.mutate(undefined, { onSuccess: () => setConfirm(null) })}
          onClose={() => setConfirm(null)}
          loading={sign.isPending}
        />
      )}
      {confirm === "deliver" && (
        <ConfirmModal
          title="¿Marcar como entregado?"
          description="Se registrará la entrega del informe al paciente."
          confirmLabel="Confirmar entrega"
          confirmClass="bg-green-600 text-white hover:bg-green-700"
          onConfirm={() => deliver.mutate(undefined, { onSuccess: () => setConfirm(null) })}
          onClose={() => setConfirm(null)}
          loading={deliver.isPending}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {statusLabel}
              </span>
              {report.is_corrected && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  Corrección v{report.version}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Paciente: <span className="font-medium text-gray-900">{report.patient?.full_name}</span>
              {" · "}{report.patient?.medical_record_number}
            </p>
            <p className="text-sm text-gray-500">
              Creado por <span className="font-medium">{report.created_by?.full_name ?? "—"}</span>
              {" · "}{formatDate(report.created_at)}
            </p>
            {report.signed_by && (
              <p className="text-sm text-gray-500">
                Firmado por <span className="font-medium">{report.signed_by.full_name}</span>
                {report.signed_at && ` · ${formatDate(report.signed_at)}`}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {report.status === "borrador" && (
              <>
                {!editing && (
                  <button
                    onClick={startEdit}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => setConfirm("sign")}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Firmar
                </button>
              </>
            )}
            {report.status === "firmado" && (
              <button
                onClick={() => setConfirm("deliver")}
                className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Marcar entregado
              </button>
            )}
            {(report.status === "firmado" || report.status === "entregado") && (
              <>
                <button
                  onClick={handlePrint}
                  className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Descargar PDF
                </button>
                <Link
                  href={`/dashboard/reports/new?patient_id=${report.patient_id}&correct=${report.id}`}
                  className="border border-orange-300 text-orange-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-orange-50 transition-colors"
                >
                  Crear corrección
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Vista de Impresión (Oculta en pantalla) */}
      {isPrinting && (
        <div className="hidden print:block">
          <ReportPrintView report={report} />
        </div>
      )}

      {/* Contenido */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Contenido del informe</h3>
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={12}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={update.isPending}
                className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {update.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        ) : (
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed min-h-[200px]">
            {report.content?.text || (
              <span className="text-gray-400 italic">Sin contenido</span>
            )}
          </pre>
        )}
      </div>

      {/* Token de acceso */}
      {report.status !== "borrador" && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Token de acceso del paciente</p>
          <code className="text-xs text-gray-700 break-all">{report.access_token}</code>
        </div>
      )}
    </div>
  );
}
