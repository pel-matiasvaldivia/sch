export interface Patient {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dni: string;
  birth_date: string;
  sex: "M" | "F" | "Otro";
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  phone_alt?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_plan?: string;
  insurance_number?: string;
  blood_type?: string;
  clinical_notes?: Record<string, unknown>;
  primary_doctor_id?: string;
  user_id?: string;
  portal_access_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCreateResponse extends Patient {
  temp_password?: string;
  user_email?: string;
}

export interface PatientSummary {
  id: string;
  medical_record_number: string;
  full_name: string;
  dni: string;
  birth_date: string;
  phone?: string;
  insurance_provider?: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: string;
  sex: "M" | "F" | "Otro";
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  phone_alt?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_plan?: string;
  insurance_number?: string;
  blood_type?: string;
  clinical_notes?: Record<string, unknown>;
  primary_doctor_id?: string;
}

export type PatientUpdate = Partial<PatientCreate> & {
  portal_access_enabled?: boolean;
};

export interface PaginatedPatients {
  items: Patient[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PatientSearchResult {
  items: PatientSummary[];
  total: number;
}
