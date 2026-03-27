"use client";

import { Search, ShieldAlert, ShieldCheck, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mock data
type UserRoleData = { id: string; email: string; name: string; currentRole: string; status: "Activo" | "Pendiente" };
const mockUsers: UserRoleData[] = [
  { id: "u1", name: "Matias Valdivia", email: "matias@clinica.com", currentRole: "admin", status: "Activo" },
  { id: "u2", name: "Carlos Pérez", email: "c.perez@clinica.com", currentRole: "medico", status: "Activo" },
  { id: "u3", name: "Julieta Ramírez", email: "j.ramirez@clinica.com", currentRole: "tecnico", status: "Activo" },
  { id: "u4", name: "Recepcionista Turnos", email: "recepcion@clinica.com", currentRole: "administrativo", status: "Activo" },
];

export function RolesPermissions() {
  const [users, setUsers] = useState(mockUsers);

  const assignRole = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, currentRole: newRole } : user))
    );
    toast.success("Rol de usuario actualizado exitosamente");
  };

  const rolesList = [
    { value: "admin", label: "Administrador / Sistema" },
    { value: "medico", label: "Médico / Profesional" },
    { value: "tecnico", label: "Técnico / Laboratorio" },
    { value: "administrativo", label: "Secretaría / Facturación" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Control de Roles y Permisos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Asigna los permisos del sistema (Sidebar visibility) a los usuarios registrados.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <div className="md:col-span-1 bg-blue-50 border border-blue-100 rounded-xl p-5">
          <ShieldAlert className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-blue-900">Atención Crítica</h3>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Otorgar el rol de Administrador concede permisos destructivos de facturación y configuración general.
          </p>
        </div>
        <div className="md:col-span-3">
          <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por email o nombre..."
                  className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium">Usuario</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 font-medium">Rol del Sistema</th>
                    <th className="px-6 py-3 font-medium text-right">Confirmar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.currentRole}
                          onChange={(e) => assignRole(user.id, e.target.value)}
                          className="flex h-9 w-full min-w-[180px] rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {rolesList.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          <ShieldCheck className="h-5 w-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-xs font-medium text-gray-500">Guardado Automático</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
