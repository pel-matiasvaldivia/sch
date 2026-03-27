export type ServiceStatus = "solicitada" | "en_proceso" | "para_validar" | "completada" | "cancelada";

export type ServiceType =
  | "consulta_medica"
  | "hematologia"
  | "coagulacion"
  | "puncion"
  | "laboratorio"
  | "extraccion"
  | "infusion";

export type ServiceLocation = "clinica" | "hospital" | "geriatrico" | "domicilio";

export interface PatientSummary {
  id: string;
  full_name: string;
  medical_record_number: string;
}

export interface UserSummary {
  id: string;
  full_name: string;
}

export interface MedicalService {
  id: string;
  patient_id: string;
  appointment_id?: string | null;
  performed_by_id?: string | null;
  requested_by_id: string;
  service_type: ServiceType;
  status: ServiceStatus;
  location: ServiceLocation;
  performed_at?: string | null;
  clinical_observations?: string | null;
  service_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  patient?: PatientSummary | null;
  performed_by?: UserSummary | null;
  requested_by?: UserSummary | null;
}

export interface MedicalServiceCreate {
  patient_id: string;
  appointment_id?: string;
  requested_by_id?: string;
  performed_by_id?: string;
  service_type: ServiceType;
  location: ServiceLocation;
  clinical_observations?: string;
}

export interface MedicalServiceUpdate {
  status?: ServiceStatus;
  performed_by_id?: string;
  performed_at?: string;
  clinical_observations?: string;
  service_data?: Record<string, unknown>;
}

export interface MedicalServiceList {
  items: MedicalService[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  solicitada: "Solicitada",
  en_proceso: "En Proceso",
  para_validar: "Para Validar",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const SERVICE_STATUS_COLORS: Record<ServiceStatus, string> = {
  solicitada: "bg-yellow-100 text-yellow-800",
  en_proceso: "bg-blue-100 text-blue-800",
  para_validar: "bg-purple-100 text-purple-800",
  completada: "bg-green-100 text-green-800",
  cancelada: "bg-gray-100 text-gray-600",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  consulta_medica: "Consulta Médica",
  hematologia: "Hematología",
  coagulacion: "Coagulación",
  puncion: "Punción",
  laboratorio: "Laboratorio",
  extraccion: "Extracción",
  infusion: "Infusión",
};

export const LOCATION_LABELS: Record<ServiceLocation, string> = {
  clinica: "Clínica",
  hospital: "Hospital",
  geriatrico: "Geriátrico",
  domicilio: "Domicilio",
};

export const STATUS_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  solicitada: ["en_proceso", "cancelada"],
  en_proceso: ["para_validar", "cancelada"],
  para_validar: ["completada", "cancelada"],
  completada: [],
  cancelada: [],
};
