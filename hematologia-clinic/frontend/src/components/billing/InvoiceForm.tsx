"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateInvoice } from "@/hooks/use-billing";
import { useSearchPatients } from "@/hooks/use-patients";
import type { InvoiceItemCreate } from "@/types/billing";

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "obra_social", label: "Obra social" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface Props {
  defaultPatientId?: string;
}

export function InvoiceForm({ defaultPatientId }: Props) {
  const router = useRouter();
  const createInvoice = useCreateInvoice();

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId ?? "");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: patientResults } = useSearchPatients(patientSearch);

  // Invoice fields
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [notes, setNotes] = useState("");

  // Items
  const [items, setItems] = useState<InvoiceItemCreate[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const total = items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItemCreate, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function selectPatient(id: string, name: string) {
    setSelectedPatientId(id);
    setSelectedPatientName(name);
    setPatientSearch("");
    setShowSuggestions(false);
  }

  function clearPatient() {
    setSelectedPatientId("");
    setSelectedPatientName("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) return;

    const validItems = items.filter(
      (item) => item.description.trim() && item.unit_price > 0
    );
    if (validItems.length === 0) return;

    createInvoice.mutate(
      {
        patient_id: selectedPatientId,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        insurance_provider: insuranceProvider || undefined,
        notes: notes || undefined,
        items: validItems,
      },
      {
        onSuccess: () => router.push("/dashboard/billing"),
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Paciente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paciente <span className="text-red-500">*</span>
        </label>
        {selectedPatientId ? (
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
            <span className="flex-1 text-sm text-gray-900">
              {selectedPatientName}
            </span>
            {!defaultPatientId && (
              <button
                type="button"
                onClick={clearPatient}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Buscar por nombre o DNI..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {showSuggestions && patientResults && patientResults.items.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {patientResults.items.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      onClick={() => selectPatient(p.id, p.full_name)}
                    >
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-gray-400 ml-2">
                        {p.medical_record_number}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Fechas y obra social */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de emisión <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de vencimiento
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Obra social (opcional)
          </label>
          <input
            type="text"
            value={insuranceProvider}
            onChange={(e) => setInsuranceProvider(e.target.value)}
            placeholder="Nombre de la obra social"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Ítems <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-primary hover:underline font-medium"
          >
            + Agregar ítem
          </button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <span className="col-span-6">Descripción</span>
            <span className="col-span-2 text-center">Cantidad</span>
            <span className="col-span-3 text-right">Precio unitario</span>
            <span className="col-span-1" />
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                required
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="Descripción del servicio"
                className="col-span-12 sm:col-span-6 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <input
                type="number"
                min={1}
                required
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseInt(e.target.value) || 1)
                }
                className="col-span-4 sm:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={item.unit_price || ""}
                onChange={(e) =>
                  updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="col-span-7 sm:col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <div className="col-span-1 flex justify-center">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <span className="text-sm text-gray-500">Total: </span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>

      {createInvoice.error && (
        <p className="text-sm text-red-600">
          {createInvoice.error instanceof Error
            ? createInvoice.error.message
            : "Error al crear la factura"}
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
          disabled={createInvoice.isPending || !selectedPatientId}
          className="flex-1 sm:flex-none bg-primary text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {createInvoice.isPending ? "Creando..." : "Crear factura"}
        </button>
      </div>
    </form>
  );
}
