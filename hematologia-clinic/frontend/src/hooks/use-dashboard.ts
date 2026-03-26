import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface TurnoResumen {
  id: string;
  hora: string;
  paciente: string;
  tipo: string;
  status: string;
}

export interface DashboardStats {
  turnos_hoy: number;
  turnos_pendientes_hoy: number;
  pacientes_activos: number;
  pacientes_nuevos_mes: number;
  informes_borrador: number;
  facturas_pendientes: number;
  monto_pendiente: number;
  proximos_turnos: TurnoResumen[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get<DashboardStats>("/v1/dashboard/stats"),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchInterval: 2 * 60 * 1000,
  });
}
