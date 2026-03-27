"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  MedicalService,
  MedicalServiceCreate,
  MedicalServiceList,
  MedicalServiceUpdate,
} from "@/types/services";

export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

interface ListServicesParams extends Record<string, unknown> {
  page?: number;
  size?: number;
  patient_id?: string;
  status?: string;
  service_type?: string;
}

export function useServices(params: ListServicesParams = {}) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () =>
      api.get<MedicalServiceList>("/v1/services/", {
        params: params as Record<string, string>,
      }),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => api.get<MedicalService>(`/v1/services/${id}`),
    enabled: !!id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MedicalServiceCreate) =>
      api.post<MedicalService>("/v1/services/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

export function useUpdateService(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MedicalServiceUpdate) =>
      api.patch<MedicalService>(`/v1/services/${id}`, data),
    onSuccess: (updated: MedicalService) => {
      queryClient.setQueryData(serviceKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

export function useUpdateServiceById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MedicalServiceUpdate }) =>
      api.patch<MedicalService>(`/v1/services/${id}`, data),
    onSuccess: (updated: MedicalService, { id }) => {
      queryClient.setQueryData(serviceKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}
