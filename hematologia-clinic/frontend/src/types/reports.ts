export interface PatientSummary {
  id: string;
  full_name: string;
  medical_record_number: string;
}

export interface UserSummary {
  id: string;
  full_name: string;
}

export type ReportStatus = "borrador" | "firmado" | "entregado";

export interface Report {
  id: string;
  patient_id: string;
  service_id: string | null;
  report_type: string;
  status: ReportStatus;
  content: Record<string, string> | null;
  pdf_path: string | null;
  access_token: string;
  signed_at: string | null;
  version: number;
  is_corrected: boolean;
  previous_version_id: string | null;
  notification_sent: boolean;
  patient: PatientSummary | null;
  created_by: UserSummary | null;
  signed_by: UserSummary | null;
  created_at: string;
  updated_at: string;
}

export interface ReportList {
  items: Report[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ReportCreate {
  patient_id: string;
  service_id?: string;
  report_type: string;
  content?: Record<string, string>;
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  borrador: "Borrador",
  firmado: "Firmado",
  entregado: "Entregado",
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  borrador: "bg-yellow-100 text-yellow-800",
  firmado: "bg-blue-100 text-blue-800",
  entregado: "bg-green-100 text-green-800",
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
  hemograma: "Hemograma",
  coagulacion: "Coagulación",
  citologia: "Citología",
  biopsia: "Biopsia",
  laboratorio: "Laboratorio general",
  consulta: "Consulta médica",
  otro: "Otro",
};

export const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS);
