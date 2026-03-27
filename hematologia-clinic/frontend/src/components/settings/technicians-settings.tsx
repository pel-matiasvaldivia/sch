"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/use-users";

const techSchema = z.object({
  full_name: z.string().min(2, "El nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, "Formato CUIT inválido (XX-XXXXXXXX-X)"),
  techSpecialty: z.string().min(2, "Especialidad técnica requerida"),
});

type TechValues = z.infer<typeof techSchema>;

export function TechniciansSettings() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading } = useUsers({ role: "tecnico", size: 100 });
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors},
  } = useForm<TechValues>({
    resolver: zodResolver(techSchema),
  });

  const techs = (usersData?.items || []).filter((u) =>
    search
      ? u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const onSubmit = async (data: TechValues) => {
    try {
      await createUser.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: "Temp1234!", // contraseña temporal
        role_names: ["tecnico"],
      });
      toast.success(`Técnico ${data.full_name} registrado. Contraseña temporal: Temp1234!`);
      setShowModal(false);
      reset();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar técnico");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al técnico ${name}?`)) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success("Técnico eliminado.");
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Directorio de Técnicos Hematólogos</h2>
          <p className="text-sm text-gray-500 mt-1">Gestión del personal de laboratorio y extracciones.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Técnico
        </button>
      </div>

      <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center bg-gray-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Técnico</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Cargando...</td>
                </tr>
              )}
              {!isLoading && techs.map((tech) => (
                <tr key={tech.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {tech.full_name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{tech.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      tech.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {tech.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(tech.id, tech.full_name)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && techs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay técnicos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alta Técnico */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Dar de Alta Técnico / Extraccionista</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nombre Completo *</label>
                  <input
                    {...register("full_name")}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <input
                    {...register("email")}
                    type="email"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">CUIT *</label>
                  <input
                    {...register("cuit")}
                    placeholder="XX-XXXXXXXX-X"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.cuit && <p className="text-xs text-red-500">{errors.cuit.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Especialidad Técnica *</label>
                  <select
                    {...register("techSpecialty")}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecciona área técnica...</option>
                    <option value="Laboratorista Clínico">Laboratorista Clínico</option>
                    <option value="Extraccionista">Extraccionista</option>
                    <option value="Técnico en Hemoterapia">Técnico en Hemoterapia</option>
                    <option value="Biólogo Molecular">Biólogo Molecular</option>
                  </select>
                  {errors.techSpecialty && <p className="text-xs text-red-500">{errors.techSpecialty.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Número de Contacto</label>
                  <input
                    {...register("phone")}
                    placeholder="+54 11..."
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {createUser.isPending ? "Registrando..." : "Guardar Técnico"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
