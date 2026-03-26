"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardStats } from "@/hooks/use-dashboard";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  presente: "Presente",
  en_progreso: "En progreso",
  concluido: "Concluido",
  ausente: "Ausente",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  presente: "bg-green-100 text-green-800",
  en_progreso: "bg-purple-100 text-purple-800",
  concluido: "bg-gray-100 text-gray-700",
  ausente: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-500",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-9 w-16 bg-gray-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export function DashboardClient() {
  const pathname = usePathname();
  const { data: stats, isLoading, refetch } = useDashboardStats();

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Turnos hoy"
          value={stats?.turnos_hoy ?? "—"}
          subtitle={
            isLoading
              ? "Cargando..."
              : `${stats?.turnos_pendientes_hoy ?? 0} pendientes de atender`
          }
          color="bg-blue-50"
          loading={isLoading}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KpiCard
          title="Pacientes registrados"
          value={stats?.pacientes_activos ?? "—"}
          subtitle={
            isLoading
              ? "Cargando..."
              : `${stats?.pacientes_nuevos_mes ?? 0} nuevos este mes`
          }
          color="bg-green-50"
          loading={isLoading}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Informes pendientes"
          value={stats?.informes_borrador ?? "—"}
          subtitle="Sin firmar"
          color="bg-yellow-50"
          loading={isLoading}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <KpiCard
          title="Cobranzas pendientes"
          value={stats?.facturas_pendientes ?? "—"}
          subtitle={
            isLoading
              ? "Cargando..."
              : `${formatCurrency(stats?.monto_pendiente ?? 0)} a cobrar`
          }
          color="bg-purple-50"
          loading={isLoading}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Turnos del día */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Turnos del día</h2>
          <Link
            href="/dashboard/appointments"
            className="text-sm text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="h-4 w-12 bg-gray-100 animate-pulse rounded" />
                <div className="h-4 w-40 bg-gray-100 animate-pulse rounded" />
                <div className="h-4 w-24 bg-gray-100 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : !stats?.proximos_turnos.length ? (
          <p className="px-6 py-8 text-sm text-center text-muted-foreground">
            No hay turnos programados para hoy
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.proximos_turnos.map((turno) => (
              <Link
                key={turno.id}
                href={`/dashboard/appointments/${turno.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-mono font-semibold text-gray-900 w-12 shrink-0">
                  {turno.hora}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {turno.paciente}
                  </p>
                  <p className="text-xs text-muted-foreground">{turno.tipo}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    STATUS_COLORS[turno.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[turno.status] ?? turno.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/dashboard/patients/new", label: "Nuevo paciente", icon: "👤" },
            { href: "/dashboard/appointments/new", label: "Nuevo turno", icon: "📅" },
            { href: "/dashboard/reports", label: "Ver informes", icon: "📄" },
            { href: "/dashboard/billing", label: "Facturación", icon: "💰" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-primary/50 transition-colors text-center"
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
