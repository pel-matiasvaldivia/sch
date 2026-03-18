/**
 * Cliente HTTP centralizado con inyección de token y refresco silencioso.
 * Todas las llamadas al backend pasan por aquí.
 */

const API_BASE = "/api/backend";

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function silentRefresh(): Promise<void> {
  if (isRefreshing) {
    return new Promise<void>((resolve) => {
      refreshSubscribers.push(() => resolve());
    });
  }

  isRefreshing = true;
  try {
    const resp = await fetch("/api/auth/refresh", { method: "POST" });
    if (!resp.ok) {
      // Redirigir al login
      window.location.href = "/login";
      throw new ApiError(401, "REFRESH_FAILED", "Sesión expirada");
    }
    onRefreshed("refreshed");
  } finally {
    isRefreshing = false;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Construir URL con query params
  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        qs.set(key, String(value));
      }
    });
    const qsStr = qs.toString();
    if (qsStr) url += `?${qsStr}`;
  }

  const fetchWithAuth = async (): Promise<Response> => {
    return fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      credentials: "include", // Incluye cookies automáticamente
    });
  };

  let response = await fetchWithAuth();

  // Token expirado — intentar refresh silencioso
  if (response.status === 401) {
    await silentRefresh();
    response = await fetchWithAuth();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: { code: "UNKNOWN_ERROR", message: "Error desconocido" },
    }));
    throw new ApiError(
      response.status,
      errorData.error?.code || "UNKNOWN_ERROR",
      errorData.error?.message || "Error en la solicitud"
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export { ApiError };
