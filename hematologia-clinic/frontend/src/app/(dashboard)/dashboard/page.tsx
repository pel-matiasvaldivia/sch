"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  
  useEffect(() => {
    if (user?.roles.includes("paciente")) {
      router.replace("/dashboard/portal/appointments");
    } else if (user?.roles.includes("medico")) {
      router.replace("/dashboard/queue");
    } else if (user?.roles.includes("tecnico")) {
      router.replace("/dashboard/services/technician");
    }
  }, [user, router]);

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Redirigir roles con pantalla propia
  if (
    user?.roles.includes("paciente") ||
    user?.roles.includes("medico") ||
    user?.roles.includes("tecnico")
  ) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground capitalize">
          Resumen del día — {today}
        </p>
      </div>
      <DashboardClient />
    </div>
  );
}
