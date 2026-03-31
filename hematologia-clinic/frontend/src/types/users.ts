export interface RoleRead {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserRead {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  must_change_password: boolean;
  totp_enabled: boolean;
  failed_login_attempts: number;
  last_login_at?: string | null;
  roles: RoleRead[];
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
  role_names: string[];
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  role_names?: string[];
}

export interface UserList {
  items: UserRead[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  medico: "Médico",
  administrativo: "Administrativo",
  tecnico: "Técnico",
  paciente: "Paciente",
};

export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  medico: "bg-blue-100 text-blue-800",
  administrativo: "bg-orange-100 text-orange-800",
  tecnico: "bg-teal-100 text-teal-800",
  paciente: "bg-gray-100 text-gray-600",
};

export const ALL_ROLES = ["admin", "medico", "administrativo", "tecnico", "paciente"] as const;
