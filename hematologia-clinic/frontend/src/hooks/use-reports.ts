"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Report, ReportCreate, ReportList } from "@/types/reports";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
};

interface ListReportsParams extends Record<string, unknown> {
  page?: number;
  size?: number;
  patient_id?: string;
  status?: string;
  report_type?: string;
  search?: string;
}

export function useReports(params: ListReportsParams = {}) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () =>
      api.get<ReportList>("/v1/reports/", {
        params: params as Record<string, string>,
      }),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => api.get<Report>(`/v1/reports/${id}`),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportCreate) =>
      api.post<Report>("/v1/reports/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ReportCreate>) =>
      api.patch<Report>(`/v1/reports/${id}`, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(reportKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useSignReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Report>(`/v1/reports/${id}/sign`, {}),
    onSuccess: (updated) => {
      queryClient.setQueryData(reportKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useDeliverReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Report>(`/v1/reports/${id}/deliver`, {}),
    onSuccess: (updated) => {
      queryClient.setQueryData(reportKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useCorrectReport(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportCreate) =>
      api.post<Report>(`/v1/reports/${id}/correct`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}
