"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const ROUTE_PERMISSIONS: Array<{ path: string; roles: string[] }> = [
  { path: "/dashboard/users",        roles: ["admin"] },
  { path: "/dashboard/settings",     roles: ["admin"] },
  { path: "/dashboard/billing",      roles: ["admin", "administrativo"] },
  { path: "/dashboard/reports",      roles: ["admin", "medico", "administrativo"] },
  { path: "/dashboard/services",     roles: ["admin", "medico", "tecnico", "administrativo"] },
  { path: "/dashboard/appointments", roles: ["admin", "medico", "administrativo"] },
  { path: "/dashboard/patients",     roles: ["admin", "medico", "administrativo"] },
];

function canAccess(pathname: string, userRoles: string[]): boolean {
  const rule = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.path));
  if (!rule) return true;
  return rule.roles.some((r) => userRoles.includes(r));
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userRoles = user?.roles ?? [];

  // Esperar a que Zustand hidrate desde sessionStorage antes de verificar.
  // En el primer render del servidor user=null, por eso bloqueamos hasta
  // que el cliente confirme su estado real.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user && !canAccess(pathname, userRoles)) {
      router.replace("/dashboard/access-denied");
    }
  }, [hydrated, pathname, user, userRoles, router]);

  // Mientras hidrata: no renderizar nada (evita flash de contenido)
  if (!hydrated) return null;

  // Hidratado pero sin acceso: bloquear mientras redirige
  if (user && !canAccess(pathname, userRoles)) return null;

  return <>{children}</>;
}
