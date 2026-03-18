"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  PaginatedPatients,
  Patient,
  PatientCreate,
  PatientSearchResult,
  PatientUpdate,
} from "@/types/patients";

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...patientKeys.lists(), filters] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  search: (q: string) => [...patientKeys.all, "search", q] as const,
};

interface ListPatientsParams {
  page?: number;
  size?: number;
  search?: string;
  insurance_provider?: string;
  doctor_id?: string;
}

export function usePatients(params: ListPatientsParams = {}) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () =>
      api.get<PaginatedPatients>("/v1/patients/", { params: params as Record<string, string> }),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => api.get<Patient>(`/v1/patients/${id}`),
    enabled: !!id,
  });
}

export function useSearchPatients(query: string, limit = 20) {
  return useQuery({
    queryKey: patientKeys.search(query),
    queryFn: () =>
      api.get<PatientSearchResult>("/v1/patients/search", {
        params: { q: query, limit },
      }),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatientCreate) => api.post<Patient>("/v1/patients/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatientUpdate) =>
      api.patch<Patient>(`/v1/patients/${id}`, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(patientKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}
