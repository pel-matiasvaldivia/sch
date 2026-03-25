"use client";

import { useState } from "react";
import Link from "next/link";
import { useReports, useSignReport, useDeliverReport, useDeleteReport } from "@/hooks/use-reports";
import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  type Report,
  type ReportStatus,
} from "@/types/reports";
import { AccessDenied } from "@/components/ui/AccessDenied";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

// ─── Confirm modal ───
interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClass = "bg-primary text-white hover:bg-primary/90",
  onConfirm,
  onClose,
  loading,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row actions ───
interface RowActionsProps {
  report: Report;
}

function RowActions({ report }: RowActionsProps) {
  const [confirmAction, setConfirmAction] = useState<"sign" | "deliver" | "delete" | null>(null);
  const sign = useSignReport(report.id);
  const deliver = useDeliverReport(report.id);
  const deleteReport = useDeleteReport();

  return (
    <>
      {confirmAction === "sign" && (
        <ConfirmModal
          title="¿Firmar informe?"
          description="Una vez firmado no podrá editarse. Solo podrá crearse una corrección."
          confirmLabel="Firmar"
          confirmClass="bg-blue-600 text-white hover:bg-blue-700"
          onConfirm={() => sign.mutate(undefined, { onSuccess: () => setConfirmAction(null) })}
          onClose={() => setConfirmAction(null)}
          loading={sign.isPending}
        />
      )}
      {confirmAction === "deliver" && (
        <ConfirmModal
          title="¿Marcar como entregado?"
          description="Se registrará que el informe fue entregado al paciente."
          confirmLabel="Confirmar entrega"
          confirmClass="bg-green-600 text-white hover:bg-green-700"
          onConfirm={() => deliver.mutate(undefined, { onSuccess: () => setConfirmAction(null) })}
          onClose={() => setConfirmAction(null)}
          loading={deliver.isPending}
        />
      )}
      {confirmAction === "delete" && (
        <ConfirmModal
          title="¿Eliminar informe?"
          description="Esta acción no se puede deshacer. Solo se pueden eliminar informes en borrador."
          confirmLabel="Eliminar"
          confirmClass="bg-red-600 text-white hover:bg-red-700"
          onConfirm={() =>
            deleteReport.mutate(report.id, { onSuccess: () => setConfirmAction(null) })
          }
          onClose={() => setConfirmAction(null)}
          loading={deleteReport.isPending}
        />
      )}

      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Link
          href={`/dashboard/reports/${report.id}`}
          className="text-xs text-primary hover:underline font-medium"
        >
          Ver
        </Link>
        {report.status === "borrador" && (
          <>
            <Link
              href={`/dashboard/reports/${report.id}/edit`}
              className="text-xs text-gray-500 hover:underline font-medium"
            >
              Editar
            </Link>
            <button
              onClick={() => setConfirmAction("sign")}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Firmar
            </button>
            <button
              onClick={() => setConfirmAction("delete")}
              className="text-xs text-red-500 hover:underline font-medium"
            >
              Eliminar
            </button>
          </>
        )}
        {report.status === "firmado" && (
          <button
            onClick={() => setConfirmAction("deliver")}
            className="text-xs text-green-600 hover:underline font-medium"
          >
            Entregar
          </button>
        )}
      </div>
    </>
  );
}

// ─── Main ───
export function ReportListClient() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useReports({
    page,
    size: 20,
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { report_type: typeFilter }),
    ...(search && { search }),
  });

  if (error) {
    const status = (error as { status?: number }).status;
    if (status === 403) return <AccessDenied />;
    return (
      <div className="text-center py-12 text-red-600 text-sm">
        Error al cargar informes
      </div>
    );
  }

  const reports = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre o DNI..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="firmado">Firmado</option>
            <option value="entregado">Entregado</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(REPORT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <Link
          href="/dashboard/reports/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Nuevo informe
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No hay informes registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Creado por</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Ver.</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {report.patient?.full_name ?? "—"}
                      {report.is_corrected && (
                        <span className="ml-2 text-xs text-orange-600 font-normal">
                          Corrección
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {report.created_by?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      v{report.version}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          REPORT_STATUS_COLORS[report.status as ReportStatus] ?? ""
                        }`}
                      >
                        {REPORT_STATUS_LABELS[report.status as ReportStatus] ?? report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RowActions report={report} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Página {page} de {totalPages} — {data?.total} informes</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
