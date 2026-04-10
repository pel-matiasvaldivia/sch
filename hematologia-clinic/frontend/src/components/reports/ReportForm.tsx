"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateReport } from "@/hooks/use-reports";
import { useSearchPatients } from "@/hooks/use-patients";
import { REPORT_TYPE_LABELS } from "@/types/reports";
import { useAuthStore } from "@/stores/auth-store";
import { VoiceRecorder } from "@/components/ui/VoiceRecorder";

interface Props {
  defaultPatientId?: string;
}

export function ReportForm({ defaultPatientId }: Props) {
  const router = useRouter();
  const createReport = useCreateReport();
  const user = useAuthStore((s) => s.user);
  const canDictate = user?.roles.some((r) => ["medico", "admin"].includes(r)) ?? false;

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId ?? "");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: patientResults } = useSearchPatients(patientSearch);

  const [reportType, setReportType] = useState("hemograma");
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) return;

    createReport.mutate(
      {
        patient_id: selectedPatientId,
        report_type: reportType,
        content: { text },
      },
      { onSuccess: () => router.push("/dashboard/reports") }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Paciente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paciente <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={selectedPatientName || patientSearch}
            onChange={(e) => {
              if (defaultPatientId) return;
              setPatientSearch(e.target.value);
              setSelectedPatientName("");
              setSelectedPatientId("");
              setShowDropdown(true);
            }}
            onFocus={() => !defaultPatientId && setShowDropdown(true)}
            disabled={!!defaultPatientId}
            placeholder="Buscar por nombre o DNI..."
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              defaultPatientId ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed" : "border-gray-300"
            }`}
          />
          {showDropdown && patientResults?.items && patientResults.items.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {patientResults.items.map((p) => (
                <li
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setSelectedPatientName(`${p.full_name} — DNI ${p.dni}`);
                    setPatientSearch("");
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <span className="font-medium">{p.full_name}</span>
                  <span className="text-gray-500 ml-2">DNI {p.dni}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tipo de informe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de informe <span className="text-red-500">*</span>
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
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Contenido del informe
          </label>
          {canDictate && (
            <VoiceRecorder
              onTranscript={(t) => setText((prev) => prev ? `${prev} ${t}` : t)}
            />
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Redactá o dictá el informe médico aquí..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">
          El informe se guardará como borrador. Podrás editarlo antes de firmarlo.
        </p>
      </div>

      {createReport.error && (
        <p className="text-sm text-red-600">
          {createReport.error instanceof Error
            ? createReport.error.message
            : "Error al crear el informe"}
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
          disabled={createReport.isPending || !selectedPatientId}
          className="flex-1 sm:flex-none bg-primary text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {createReport.isPending ? "Guardando..." : "Guardar borrador"}
        </button>
      </div>
    </form>
  );
}
