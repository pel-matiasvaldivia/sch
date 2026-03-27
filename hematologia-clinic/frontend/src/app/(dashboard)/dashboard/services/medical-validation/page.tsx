"use client";

import { useState } from "react";
import { CheckCircle2, FileSignature, FileText, ChevronRight, FileBadge2 } from "lucide-react";
import { toast } from "sonner";

import { useServices, useUpdateServiceById } from "@/hooks/use-services";
import { SERVICE_TYPE_LABELS } from "@/types/services";
import { format } from "date-fns";

export default function MedicalValidationPage() {
  const { data: servicesData, isLoading } = useServices({ size: 100 });
  const updateMutation = useUpdateServiceById();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [medicalConclusions, setMedicalConclusions] = useState("");

  const services = (servicesData?.items || []).filter(
    (s) => s.status === "para_validar"
  );

  const handleSelectService = (id: string) => {
    setSelectedService(id);
    setMedicalConclusions("");
  };

  const signAndValidate = async (serviceId: string, patientId: string) => {
    try {
      // 1. Cambiar estado de la prestación a "completada" (firma digital)
      await updateMutation.mutateAsync({
        id: serviceId,
        data: {
          status: "completada",
          // Guardamos las conclusiones médicas en service_data
          service_data: {
            conclusiones_medicas: medicalConclusions || "Sin conclusiones adicionales.",
            firmado_en: new Date().toISOString(),
            firma_digital: "certificado_digital_placeholder",
          },
        },
      });

      // 2. Notificación visual de éxito (el backend ya generó la factura)
      toast.success("✅ Informe firmado digitalmente y notificado a Finanzas.");
      setSelectedService(null);
      setMedicalConclusions("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al procesar la validación: ${msg}`);
    }
  };

  const isPending = updateMutation.isPending;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSignature className="text-purple-600" /> Validación Médica
          </h1>
          <p className="text-gray-500 mt-1">
            Revisión y firma digital de los estudios procesados por laboratorio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border text-card-foreground rounded-xl shadow-sm h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b bg-gray-50/50">
              <h3 className="font-semibold text-gray-800">Pendientes de Firma</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isLoading && <p className="text-sm text-center py-4 text-gray-500">Cargando estudios...</p>}
              {!isLoading && services.length === 0 && (
                <p className="text-sm text-center text-gray-400 py-6">Sin estudios para validar.</p>
              )}
              {!isLoading && services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectService(s.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedService === s.id
                      ? "bg-purple-50 border-purple-200 shadow-sm"
                      : "bg-white border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-900">{s.patient?.full_name || "Sin Nombre"}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      Para Validar
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{SERVICE_TYPE_LABELS[s.service_type]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedService ? (
            <div className="bg-white border rounded-xl shadow-sm p-6 h-full animate-in fade-in flex flex-col">
              {services.map((s) => {
                if (s.id !== selectedService) return null;

                return (
                  <div key={s.id} className="space-y-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start border-b pb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Validación de Análisis</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                          Paciente: <span className="text-gray-800">{s.patient?.full_name || "Sin Nombre"}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Estudio: <span className="font-medium text-gray-800">{SERVICE_TYPE_LABELS[s.service_type]}</span>
                        </p>
                      </div>
                      <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold">
                        REQUIERE FIRMA
                      </span>
                    </div>

                    <div className="flex-1 py-4 space-y-6">
                      {/* Resultados analíticos cargados por el técnico */}
                      {s.service_data?.resultados_analiticos && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Resultados de Laboratorio
                          </h4>
                          <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                            {Object.entries(s.service_data.resultados_analiticos as Record<string, string>).map(([key, val]) => (
                              <div key={key} className="flex justify-between border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, " ")}</span>
                                <span className="text-sm font-semibold text-gray-900">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observaciones del técnico */}
                      {s.clinical_observations && (
                        <div>
                          <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                            Comentarios del Técnico Hematólogo:
                          </label>
                          <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                            {s.clinical_observations}
                          </p>
                        </div>
                      )}

                      {/* Conclusiones médicas */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                          Conclusiones Médicas (se incluirán en el reporte firmado)
                        </label>
                        <textarea
                          rows={4}
                          value={medicalConclusions}
                          onChange={(e) => setMedicalConclusions(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
                          placeholder="Interpretación médica del estudio..."
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t flex justify-between items-center bg-gray-50/50 p-4 rounded-b-xl -mx-6 -mb-6">
                      <p className="text-xs text-gray-500 italic">
                        La confirmación aplicará su certificado digital y creará el ticket de cobranza en Finanzas.
                      </p>
                      <button
                        onClick={() => signAndValidate(s.id, s.patient_id)}
                        disabled={isPending}
                        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg flex font-medium items-center gap-2 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-60"
                      >
                        <FileSignature className="w-4 h-4" />
                        {isPending ? "Procesando..." : "Firmar y Notificar Finanzas"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-dashed rounded-xl h-full flex flex-col items-center justify-center text-gray-400 p-6">
              <ChevronRight className="w-12 h-12 mb-4 text-gray-300" />
              <p>Seleccioná un estudio para revisar sus valores y validarlo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
