"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useServices, useUpdateService, useDeleteService } from "@/hooks/use-services";
import { useUsers } from "@/hooks/use-users";
import { ApiError } from "@/lib/api-client";
import { AccessDenied } from "@/components/ui/AccessDenied";
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
  SERVICE_TYPE_LABELS,
  LOCATION_LABELS,
  STATUS_TRANSITIONS,
  type MedicalService,
  type ServiceStatus,
} from "@/types/services";

function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SERVICE_STATUS_COLORS[status]}`}>
      {SERVICE_STATUS_LABELS[status]}
    </span>
  );
}

interface StatusMenuProps {
  service: MedicalService;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  doctors: { id: string; full_name: string }[];
}

function StatusMenu({ service, openId, setOpenId, doctors }: StatusMenuProps) {
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [performedById, setPerformedById] = useState(service.performed_by_id ?? "");
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateMutation = useUpdateService(service.id);

  const isOpen = openId === service.id;
  const transitions = STATUS_TRANSITIONS[service.status as ServiceStatus] ?? [];

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setOpenId]);

  const handleOpen = () => {
    if (isOpen) { setOpenId(null); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 160;
      const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
      setMenuPos({ top, left: rect.left });
    }
    setOpenId(service.id);
  };

  const handleTransition = async (newStatus: ServiceStatus) => {
    if (newStatus === "en_proceso" && !performedById) {
      toast.error("Seleccioná quién realiza la prestación");
      return;
    }
    if (!confirm(`¿Cambiar estado a "${SERVICE_STATUS_LABELS[newStatus]}"?`)) return;
    try {
      await updateMutation.mutateAsync({
        status: newStatus,
        performed_by_id: newStatus === "en_proceso" ? performedById : undefined,
      });
      toast.success("Estado actualizado");
      setOpenId(null);
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <StatusBadge status={service.status as ServiceStatus} />
      {transitions.length > 0 && (
        <button
          ref={btnRef}
          onClick={handleOpen}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Cambiar estado"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {isOpen && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 50 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]"
        >
          {transitions.includes("en_proceso") && (
            <div className="mb-2">
              <label className="text-xs text-gray-500 px-1 mb-1 block">Realizado por</label>
              <select
                value={performedById}
                onChange={(e) => setPerformedById(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="">Seleccioná técnico/médico</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
          )}
          {transitions.map((s) => (
            <button
              key={s}
              onClick={() => handleTransition(s)}
              className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <span className={`inline-block w-2 h-2 rounded-full ${SERVICE_STATUS_COLORS[s].split(" ")[0]}`} />
              {SERVICE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  patientId?: string;
}

export function ServiceListClient({ patientId }: Props) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading, error } = useServices({
    page,
    size: 20,
    patient_id: patientId || undefined,
    status: statusFilter || undefined,
    service_type: serviceTypeFilter || undefined,
  });

  const { data: usersData } = useUsers({ size: 100 });
  const deleteMutation = useDeleteService();

  const staff = usersData?.items ?? [];

  const handleDelete = async (service: MedicalService) => {
    if (!confirm(`¿Eliminar esta prestación de ${service.patient?.full_name ?? "este paciente"}?`)) return;
    try {
      await deleteMutation.mutateAsync(service.id);
      toast.success("Prestación eliminada");
    } catch {
      toast.error("No se pudo eliminar la prestación");
    }
  };

  if (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <AccessDenied section="las prestaciones" />;
    }
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Error al cargar las prestaciones. Intente nuevamente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros — solo mostrar si no es vista de paciente específico */}
      {!patientId && (
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todos los estados</option>
            <option value="solicitada">Solicitada</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            value={serviceTypeFilter}
            onChange={(e) => { setServiceTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todos los tipos</option>
            <option value="consulta_medica">Consulta Médica</option>
            <option value="hematologia">Hematología</option>
            <option value="coagulacion">Coagulación</option>
            <option value="puncion">Punción</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="infusion">Infusión</option>
          </select>

          {(statusFilter || serviceTypeFilter) && (
            <button
              onClick={() => { setStatusFilter(""); setServiceTypeFilter(""); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-sm">No hay prestaciones registradas</p>
            <Link href={patientId ? `/dashboard/services/new?patient_id=${patientId}` : "/dashboard/services/new"} className="text-primary text-sm font-medium mt-2 inline-block hover:underline">
              Registrar primera prestación →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {!patientId && <th className="text-left px-4 py-3 font-medium text-gray-600">Paciente</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ubicación</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Solicitado por</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Realizado por</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    {!patientId && (
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/patients/${service.patient_id}`}
                          className="font-medium text-gray-900 hover:text-primary transition-colors"
                        >
                          {service.patient?.full_name ?? "—"}
                        </Link>
                        {service.patient?.medical_record_number && (
                          <span className="block text-xs font-mono text-gray-400">
                            {service.patient.medical_record_number}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-700">
                      {SERVICE_TYPE_LABELS[service.service_type as keyof typeof SERVICE_TYPE_LABELS] ?? service.service_type}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {LOCATION_LABELS[service.location as keyof typeof LOCATION_LABELS] ?? service.location}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{service.requested_by?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{service.performed_by?.full_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusMenu
                        service={service}
                        openId={openMenuId}
                        setOpenId={setOpenMenuId}
                        doctors={staff}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(service.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(service)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-muted-foreground">
              Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} de {data.total} prestaciones
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >←</button>
              <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">{page} / {data.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
