export type AppointmentStatus =
  | "pendiente"
  | "confirmado"
  | "presente"
  | "ausente"
  | "cancelado"
  | "en_progreso"
  | "concluido";

export type ServiceType =
  | "consulta_medica"
  | "hematologia"
  | "coagulacion"
  | "puncion"
  | "laboratorio"
  | "extraccion"
  | "infusion";

export type AppointmentLocation =
  | "clinica"
  | "hospital"
  | "geriatrico"
  | "domicilio";

export interface PatientSummary {
  id: string;
  full_name: string;
  dni: string;
  medical_record_number: string;
  phone?: string;
}

export interface DoctorSummary {
  id: string;
  full_name: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_by_id: string;
  service_type: ServiceType;
  status: AppointmentStatus;
  location: AppointmentLocation;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
  cancellation_reason?: string;
  reminder_sent: boolean;
  concluded_at?: string;
  created_at: string;
  updated_at: string;
  patient?: PatientSummary;
  doctor?: DoctorSummary;
}

export interface AppointmentCreate {
  patient_id: string;
  doctor_id: string;
  service_type: ServiceType;
  scheduled_at: string;
  duration_minutes: number;
  location: AppointmentLocation;
  notes?: string;
}

export interface AppointmentUpdate {
  doctor_id?: string;
  service_type?: ServiceType;
  scheduled_at?: string;
  duration_minutes?: number;
  location?: AppointmentLocation;
  notes?: string;
}

export interface AppointmentStatusUpdate {
  status: AppointmentStatus;
  cancellation_reason?: string;
}

export interface AppointmentList {
  items: Appointment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  consulta_medica: "Consulta Médica",
  hematologia: "Hematología",
  coagulacion: "Coagulación",
  puncion: "Punción",
  laboratorio: "Laboratorio",
  extraccion: "Extracción",
  infusion: "Infusión",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  presente: "Presente",
  ausente: "Ausente",
  cancelado: "Cancelado",
  en_progreso: "En Progreso",
  concluido: "Concluido",
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  presente: "bg-green-100 text-green-800",
  ausente: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-600",
  en_progreso: "bg-purple-100 text-purple-800",
  concluido: "bg-teal-100 text-teal-800",
};

export const LOCATION_LABELS: Record<AppointmentLocation, string> = {
  clinica: "Clínica",
  hospital: "Hospital",
  geriatrico: "Geriátrico",
  domicilio: "Domicilio",
};
