"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Appointment,
  AppointmentCreate,
  AppointmentList,
  AppointmentStatusUpdate,
  AppointmentUpdate,
} from "@/types/appointments";

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...appointmentKeys.lists(), filters] as const,
  today: () => [...appointmentKeys.all, "today"] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

interface ListAppointmentsParams extends Record<string, unknown> {
  page?: number;
  size?: number;
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  service_type?: string;
  date_from?: string;
  date_to?: string;
}

export function useAppointments(params: ListAppointmentsParams = {}) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () =>
      api.get<AppointmentList>("/v1/appointments/", {
        params: params as Record<string, string>,
      }),
  });
}

export function useAppointmentsToday() {
  return useQuery({
    queryKey: appointmentKeys.today(),
    queryFn: () => api.get<Appointment[]>("/v1/appointments/today"),
    staleTime: 60_000,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => api.get<Appointment>(`/v1/appointments/${id}`),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentCreate) =>
      api.post<Appointment>("/v1/appointments/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });
    },
  });
}

export function useUpdateAppointment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentUpdate) =>
      api.patch<Appointment>(`/v1/appointments/${id}`, data),
    onSuccess: (updated: Appointment) => {
      queryClient.setQueryData(appointmentKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });
    },
  });
}

export function useUpdateAppointmentStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentStatusUpdate) =>
      api.patch<Appointment>(`/v1/appointments/${id}/status`, data),
    onSuccess: (updated: Appointment) => {
      queryClient.setQueryData(appointmentKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.today() });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
