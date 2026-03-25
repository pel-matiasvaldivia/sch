"use client";

import { useState } from "react";
import Link from "next/link";
import { useInvoices, useRegisterPayment, useUpdateInvoice } from "@/hooks/use-billing";
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type Invoice,
  type InvoiceStatus,
} from "@/types/billing";
import { AccessDenied } from "@/components/ui/AccessDenied";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Pago parcial" },
  { value: "pagada", label: "Pagada" },
  { value: "cancelada", label: "Cancelada" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// ─── Payment Modal ───
interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
}

function PaymentModal({ invoice, onClose }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("efectivo");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reference, setReference] = useState("");
  const mutation = useRegisterPayment(invoice.id);
  const remaining = invoice.total - invoice.paid_amount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      {
        amount: parseFloat(amount),
        payment_method: method,
        payment_date: paymentDate,
        reference: reference || undefined,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Registrar pago
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {invoice.invoice_number} — Saldo pendiente:{" "}
          <span className="font-medium text-gray-900">
            {formatCurrency(remaining)}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto
            </label>
            <input
              type="number"
              step="0.01"
              max={remaining}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remaining.toFixed(2)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de pago
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de pago
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia (opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° transferencia, recibo, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {mutation.error && (
            <p className="text-sm text-red-600">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Error al registrar el pago"}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? "Registrando..." : "Confirmar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Cancel Modal ───
interface CancelModalProps {
  invoice: Invoice;
  onClose: () => void;
}

function CancelModal({ invoice, onClose }: CancelModalProps) {
  const mutation = useUpdateInvoice(invoice.id);

  function handleConfirm() {
    mutation.mutate({ status: "cancelada" }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          ¿Cancelar factura?
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Se cancelará <span className="font-medium">{invoice.invoice_number}</span>.
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={mutation.isPending}
            className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {mutation.isPending ? "Cancelando..." : "Cancelar factura"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───
export function InvoiceListClient() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [cancelingInvoice, setCancelingInvoice] = useState<Invoice | null>(null);

  const { data, isLoading, error } = useInvoices({
    page,
    size: 20,
    ...(statusFilter && { status: statusFilter }),
  });

  if (error) {
    const status = (error as { status?: number }).status;
    if (status === 403) return <AccessDenied />;
    return (
      <div className="text-center py-12 text-red-600 text-sm">
        Error al cargar facturas
      </div>
    );
  }

  const invoices = data?.items ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Modales */}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
        />
      )}
      {cancelingInvoice && (
        <CancelModal
          invoice={cancelingInvoice}
          onClose={() => setCancelingInvoice(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Link
          href="/dashboard/billing/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Nueva factura
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Cargando...
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No hay facturas registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">N° Factura</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Pagado</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {inv.patient?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(inv.paid_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          INVOICE_STATUS_COLORS[inv.status as InvoiceStatus] ?? ""
                        }`}
                      >
                        {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== "pagada" && inv.status !== "cancelada" && (
                          <button
                            onClick={() => setPayingInvoice(inv)}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Registrar pago
                          </button>
                        )}
                        {inv.status === "pendiente" && (
                          <button
                            onClick={() => setCancelingInvoice(inv)}
                            className="text-xs text-red-500 hover:underline font-medium"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
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
          <span>
            Página {page} de {totalPages} — {data?.total} facturas
          </span>
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
