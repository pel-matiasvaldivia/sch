"use client";

import { useState } from "react";
import { FlaskConical, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { useServices, useUpdateServiceById } from "@/hooks/use-services";
import { format } from "date-fns";
import { SERVICE_TYPE_LABELS } from "@/types/services";
import { useAuthStore } from "@/stores/auth-store";

// Parámetros analíticos que se recopilan por estudio
const ANALYTIC_PARAMS = [
  { key: "globulos_rojos", label: "Glóbulos Rojos", unit: "mill/mm³" },
  { key: "globulos_blancos", label: "Glóbulos Blancos", unit: "miles/mm³" },
  { key: "hemoglobina", label: "Hemoglobina", unit: "g/dL" },
  { key: "hematocrito", label: "Hematocrito", unit: "%" },
  { key: "plaquetas", label: "Plaquetas", unit: "miles/mm³" },
  { key: "vcm", label: "VCM", unit: "fL" },
];

export default function TechnicianWorkflowPage() {
  const { data: servicesData, isLoading } = useServices({ size: 100 });
  const updateMutation = useUpdateServiceById();
  const user = useAuthStore((s) => s.user);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  // Estado local para los valores analíticos mientras se completan
  const [analyticValues, setAnalyticValues] = useState<Record<string, string>>({});
  const [techObservations, setTechObservations] = useState("");

  const services = (servicesData?.items || []).filter(
    (s) => s.status === "solicitada" || s.status === "en_proceso" || s.status === "para_validar"
  );

  const handleSelectService = (id: string) => {
    setSelectedService(id);
    setAnalyticValues({});
    setTechObservations("");
  };

  const startService = async (id: string) => {
    if (!user?.id) {
      toast.error("Sesión no válida.");
      return;
    }
    try {
      await updateMutation.mutateAsync({ 
        id, 
        data: { 
          status: "en_proceso",
          performed_by_id: user.id
        } 
      });
      toast.info("Servicio marcado como 'En Proceso'.");
    } catch {
      toast.error("Error al actualizar estado.");
    }
  };

  const submitResults = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      // Persiste los resultados analíticos en service_data (campo JSON) y cambia el estado
      await updateMutation.mutateAsync({
        id,
        data: {
          status: "para_validar",
          clinical_observations: techObservations || "Sin observaciones adicionales.",
          // service_data almacena los resultados estructurados para que el médico los consulte
          service_data: {
            resultados_analiticos: analyticValues,
            procesado_por: "Técnico Hematólogo",
            procesado_en: new Date().toISOString(),
          },
        },
      });
      toast.success("Resultados analíticos guardados y enviados a validación médica.");
      setSelectedService(null);
      setAnalyticValues({});
      setTechObservations("");
    } catch {
      toast.error("Error al enviar resultados.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="text-indigo-600" /> Portal de Técnicos
          </h1>
          <p className="text-gray-500 mt-1">
            Bandeja de turnos y prestaciones pendientes de resultados analíticos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandeja de Tareas (Izquierda) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border text-card-foreground rounded-xl shadow-sm h-[calc(100vh-200px)] flex flex-col">
            <div className="p-4 border-b bg-gray-50/50">
              <h3 className="font-semibold text-gray-800">Lista de Trabajo</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isLoading && <p className="text-sm text-center py-4 text-gray-500">Cargando tareas...</p>}
              {!isLoading && services.length === 0 && (
                <p className="text-sm text-center py-6 text-gray-400">Sin prestaciones pendientes.</p>
              )}
              {!isLoading && services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectService(s.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedService === s.id
                      ? "bg-indigo-50 border-indigo-200 shadow-sm"
                      : "bg-white border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-900">{s.patient?.full_name || "Sin Nombre"}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        s.status === "solicitada"
                          ? "bg-yellow-100 text-yellow-700"
                          : s.status === "en_proceso"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{SERVICE_TYPE_LABELS[s.service_type]}</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    {format(new Date(s.created_at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de Área de Trabajo (Derecha) */}
        <div className="lg:col-span-2">
          {selectedService ? (
            <div className="bg-white border rounded-xl shadow-sm p-6 h-full animate-in fade-in">
              {services.map((s) => {
                if (s.id !== selectedService) return null;

                if (s.status === "solicitada") {
                  return (
                    <div key={s.id} className="text-center py-20">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FlaskConical className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">{SERVICE_TYPE_LABELS[s.service_type]}</h2>
                      <p className="text-gray-500 mb-6">Paciente: {s.patient?.full_name || "Sin Nombre"}</p>
                      <button
                        onClick={() => startService(s.id)}
                        disabled={updateMutation.isPending}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition disabled:opacity-60"
                      >
                        {updateMutation.isPending ? "Procesando..." : "Comenzar Extracción / Prueba"}
                      </button>
                    </div>
                  );
                }

                if (s.status === "en_proceso") {
                  return (
                    <div key={s.id} className="space-y-6">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Carga de Resultados</h2>
                          <p className="text-sm font-medium text-gray-500 mt-1">
                            {s.patient?.full_name || "Sin Nombre"} — {SERVICE_TYPE_LABELS[s.service_type]}
                          </p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                          EN PROCESO
                        </span>
                      </div>

                      <form onSubmit={(e) => submitResults(e, s.id)} className="space-y-5">
                        {/* Resultados analíticos estructurados */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">
                            Parámetros Analíticos
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            {ANALYTIC_PARAMS.map((param) => (
                              <div key={param.key}>
                                <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                                  {param.label}
                                  <span className="ml-1 text-gray-400 normal-case font-normal">({param.unit})</span>
                                </label>
                                <input
                                  required
                                  type="number"
                                  step="0.01"
                                  value={analyticValues[param.key] || ""}
                                  onChange={(e) =>
                                    setAnalyticValues((prev) => ({
                                      ...prev,
                                      [param.key]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                  placeholder="0.00"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700 uppercase mb-1 block">
                            Observaciones de Laboratorio
                          </label>
                          <textarea
                            rows={3}
                            value={techObservations}
                            onChange={(e) => setTechObservations(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                            placeholder="Anotaciones extra para el médico..."
                          />
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                          <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="px-6 py-2.5 bg-green-600 text-white rounded-lg flex font-medium items-center gap-2 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {updateMutation.isPending ? "Guardando..." : "Enviar a Médico (Validar)"}
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                }

                if (s.status === "para_validar") {
                  return (
                    <div key={s.id} className="text-center py-20">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-purple-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Estudio Procesado</h2>
                      <p className="text-gray-500">
                        Los resultados fueron guardados y enviados al médico especialista para su firma.
                      </p>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          ) : (
            <div className="bg-white border border-dashed rounded-xl h-full flex flex-col items-center justify-center text-gray-400 p-6">
              <ChevronRight className="w-12 h-12 mb-4 text-gray-300" />
              <p>Seleccioná una prestación de la lista para trabajar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
