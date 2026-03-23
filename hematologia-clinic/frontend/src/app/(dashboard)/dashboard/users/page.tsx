import type { Metadata } from "next";
import Link from "next/link";
import { UserListClient } from "@/components/users/UserListClient";

export const metadata: Metadata = { title: "Usuarios" };

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de cuentas y permisos del sistema</p>
        </div>
        <Link
          href="/dashboard/users/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </Link>
      </div>

      <UserListClient />
    </div>
  );
}
