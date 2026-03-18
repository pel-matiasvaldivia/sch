import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea fecha ISO → DD/MM/YYYY */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(date, "dd/MM/yyyy", { locale: es });
  } catch {
    return "—";
  }
}

/** Formatea fecha ISO → DD/MM/YYYY HH:mm */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return "—";
  }
}

/** Calcula edad en años a partir de fecha de nacimiento */
export function calculateAge(birthDateStr: string): number {
  const birth = parseISO(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Formatea DNI con puntos: 30.123.456 */
export function formatDNI(dni: string): string {
  const clean = dni.replace(/\D/g, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formatea moneda ARS */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Capitaliza la primera letra */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Genera iniciales del nombre completo */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Traducciones de estados */
export const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  presente: "Presente",
  ausente: "Ausente",
  cancelado: "Cancelado",
  en_progreso: "En progreso",
  solicitada: "Solicitada",
  en_proceso: "En proceso",
  completada: "Completada",
  borrador: "Borrador",
  firmado: "Firmado",
  entregado: "Entregado",
};

export const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  presente: "bg-green-100 text-green-800",
  ausente: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-800",
  en_progreso: "bg-purple-100 text-purple-800",
  solicitada: "bg-yellow-100 text-yellow-800",
  completada: "bg-green-100 text-green-800",
  borrador: "bg-orange-100 text-orange-800",
  firmado: "bg-blue-100 text-blue-800",
};

export const SEX_LABELS: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  Otro: "Otro",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  medico: "Médico",
  administrativo: "Administrativo",
  tecnico: "Técnico Hematólogo",
  paciente: "Paciente",
};
