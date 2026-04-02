"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Invoice,
  InvoiceCreate,
  InvoiceList,
  InsuranceOrder,
  InsuranceOrderList,
  PaymentCreate,
} from "@/types/billing";

export const billingKeys = {
  all: ["billing"] as const,
  invoices: () => [...billingKeys.all, "invoices"] as const,
  invoiceList: (filters: Record<string, unknown>) =>
    [...billingKeys.invoices(), "list", filters] as const,
  invoice: (id: string) => [...billingKeys.invoices(), id] as const,
  insuranceOrders: () => [...billingKeys.all, "insurance-orders"] as const,
  insuranceOrderList: (filters: Record<string, unknown>) =>
    [...billingKeys.insuranceOrders(), "list", filters] as const,
};

interface ListInvoicesParams extends Record<string, unknown> {
  page?: number;
  size?: number;
  patient_id?: string;
  status?: string;
}

export function useInvoices(params: ListInvoicesParams = {}) {
  return useQuery({
    queryKey: billingKeys.invoiceList(params),
    queryFn: () =>
      api.get<InvoiceList>("/v1/billing/invoices/", {
        params: params as Record<string, string>,
      }),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: billingKeys.invoice(id),
    queryFn: () => api.get<Invoice>(`/v1/billing/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvoiceCreate) =>
      api.post<Invoice>("/v1/billing/invoices/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{ due_date: string; status: string; notes: string }>) =>
      api.patch<Invoice>(`/v1/billing/invoices/${id}`, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(billingKeys.invoice(id), updated);
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function useRegisterPayment(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentCreate) =>
      api.post<Invoice>(`/v1/billing/invoices/${invoiceId}/payments`, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(billingKeys.invoice(invoiceId), updated);
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

interface ListInsuranceParams extends Record<string, unknown> {
  page?: number;
  size?: number;
  patient_id?: string;
  status?: string;
}

export function useInsuranceOrders(params: ListInsuranceParams = {}) {
  return useQuery({
    queryKey: billingKeys.insuranceOrderList(params),
    queryFn: () =>
      api.get<InsuranceOrderList>("/v1/billing/insurance-orders/", {
        params: params as Record<string, string>,
      }),
  });
}

export function useUpdateInsuranceOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{
      status: string;
      authorization_number: string;
      rejection_reason: string;
      notes: string;
    }>) => api.patch<InsuranceOrder>(`/v1/billing/insurance-orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.insuranceOrders() });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}
