"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUsers, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { ROLE_LABELS, ROLE_COLORS, type UserRead } from "@/types/users";
import { ApiError } from "@/lib/api-client";
import { AccessDenied } from "@/components/ui/AccessDenied";

function RoleBadge({ name }: { name: string }) {
  const color = ROLE_COLORS[name] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {ROLE_LABELS[name] ?? name}
    </span>
  );
}

function ActiveToggle({ user }: { user: UserRead }) {
  const updateMutation = useUpdateUser(user.id);

  const handleToggle = async () => {
    const action = user.is_active ? "desactivar" : "activar";
    if (!confirm(`¿Querés ${action} a ${user.full_name}?`)) return;
    try {
      await updateMutation.mutateAsync({ is_active: !user.is_active });
      toast.success(`Usuario ${user.is_active ? "desactivado" : "activado"}`);
    } catch {
      toast.error("No se pudo actualizar el usuario");
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={updateMutation.isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        user.is_active ? "bg-primary" : "bg-gray-300"
      }`}
      title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          user.is_active ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function UserListClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, error } = useUsers({
    page,
    size: 20,
    search: search || undefined,
    role: roleFilter || undefined,
  });

  const deleteMutation = useDeleteUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async (user: UserRead) => {
    if (!confirm(`¿Eliminar al usuario ${user.full_name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteMutation.mutateAsync(user.id);
      toast.success("Usuario eliminado");
    } catch {
      toast.error("No se pudo eliminar el usuario");
    }
  };

  if (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <AccessDenied section="la gestión de usuarios" />;
    }
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        Error al cargar los usuarios. Intente nuevamente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Buscar
          </button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="medico">Médico</option>
          <option value="administrativo">Administrativo</option>
          <option value="tecnico">Técnico</option>
          <option value="paciente">Paciente</option>
        </select>

        {(search || roleFilter) && (
          <button
            onClick={() => { setSearch(""); setSearchInput(""); setRoleFilter(""); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 text-sm">No hay usuarios registrados</p>
            <Link href="/dashboard/users/new" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">
              Crear primer usuario →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Roles</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Teléfono</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Activo</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0
                          ? user.roles.map((r) => <RoleBadge key={r.id} name={r.name} />)
                          : <span className="text-gray-400 text-xs">Sin rol</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <ActiveToggle user={user} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/users/${user.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Editar usuario"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar usuario"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-muted-foreground">
              Mostrando {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} de {data.total} usuarios
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
                {page} / {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
