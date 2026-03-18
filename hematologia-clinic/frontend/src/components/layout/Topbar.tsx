"use client";

import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABELS } from "@/lib/utils";

export function Topbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Breadcrumbs (placeholder) */}
      <div className="text-sm text-muted-foreground">
        Sistema de Gestión Hematológica
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Menú usuario */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.roles?.[0] ? ROLE_LABELS[user.roles[0]] || user.roles[0] : ""}
            </p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
