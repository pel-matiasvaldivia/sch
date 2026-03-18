export type UserRole = "admin" | "medico" | "administrativo" | "tecnico" | "paciente";

export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  must_change_password: boolean;
  totp_enabled: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  totp_code?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
