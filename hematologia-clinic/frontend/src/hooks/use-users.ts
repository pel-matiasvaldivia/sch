"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  roles: string[];
}

interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface ListUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
}

export function useUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () =>
      api.get<PaginatedUsers>("/v1/users/", {
        params: params as Record<string, string>,
      }),
    staleTime: 5 * 60_000,
  });
}
