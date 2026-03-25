export interface PatientSummary {
  id: string;
  full_name: string;
  medical_record_number: string;
}

export interface UserSummary {
  id: string;
  full_name: string;
}

// ─── Invoice ───

export interface InvoiceItem {
  id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  received_by: UserSummary | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  insurance_provider: string | null;
  insurance_batch_number: string | null;
  notes: string | null;
  pdf_path: string | null;
  items: InvoiceItem[];
  payments: Payment[];
  patient: PatientSummary | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceList {
  items: Invoice[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export type InvoiceStatus = "pendiente" | "pagada" | "parcial" | "cancelada";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  parcial: "Pago parcial",
  cancelada: "Cancelada",
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagada: "bg-green-100 text-green-800",
  parcial: "bg-blue-100 text-blue-800",
  cancelada: "bg-red-100 text-red-800",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  obra_social: "Obra social",
};

// ─── Invoice Create ───

export interface InvoiceItemCreate {
  service_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceCreate {
  patient_id: string;
  issue_date: string;
  due_date?: string;
  insurance_provider?: string;
  insurance_batch_number?: string;
  notes?: string;
  items: InvoiceItemCreate[];
}

export interface PaymentCreate {
  amount: number;
  payment_method: string;
  payment_date: string;
  reference?: string;
  notes?: string;
}

// ─── Insurance Orders ───

export type InsuranceOrderStatus =
  | "pendiente_autorizacion"
  | "autorizada"
  | "rechazada"
  | "presentada"
  | "cobrada";

export interface InsuranceOrder {
  id: string;
  patient_id: string;
  service_id: string;
  insurance_provider: string;
  authorization_number: string | null;
  status: InsuranceOrderStatus;
  rejection_reason: string | null;
  notes: string | null;
  patient: PatientSummary | null;
  created_at: string;
  updated_at: string;
}

export interface InsuranceOrderList {
  items: InsuranceOrder[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const INSURANCE_STATUS_LABELS: Record<InsuranceOrderStatus, string> = {
  pendiente_autorizacion: "Pendiente autorización",
  autorizada: "Autorizada",
  rechazada: "Rechazada",
  presentada: "Presentada",
  cobrada: "Cobrada",
};

export const INSURANCE_STATUS_COLORS: Record<InsuranceOrderStatus, string> = {
  pendiente_autorizacion: "bg-yellow-100 text-yellow-800",
  autorizada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  presentada: "bg-blue-100 text-blue-800",
  cobrada: "bg-purple-100 text-purple-800",
};
