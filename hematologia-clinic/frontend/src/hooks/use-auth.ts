"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginCredentials } from "@/types/auth";

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout, hasRole, hasAnyRole } =
    useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Error al iniciar sesión");
      }

      return data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(`Bienvenido/a, ${data.user.full_name}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const resp = await fetch("/api/v1/users/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(errorData.detail || "Error al cambiar la contraseña");
      }
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
      if (user) {
        setUser({ ...user, must_change_password: false });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    changePassword: changePasswordMutation.mutateAsync,
    isChangePasswordLoading: changePasswordMutation.isPending,
    logout,
    hasRole,
    hasAnyRole,
  };
}
