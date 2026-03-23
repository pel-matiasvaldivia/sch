"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/use-users";
import { UserForm } from "@/components/users/UserForm";

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, error } = useUser(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/users"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
          <p className="text-muted-foreground">Modificá los datos del usuario</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error || !user ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            No se pudo cargar el usuario.
          </div>
        ) : (
          <UserForm mode="edit" user={user} />
        )}
      </div>
    </div>
  );
}
