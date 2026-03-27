"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/use-users";

// Al dar de alta un médico se crea un usuario con role "medico"
// La contraseña es temporal y el médico deberá cambiarla al primer ingreso
const doctorSchema = z.object({
  full_name: z.string().min(2, "El nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  matricula: z.string().min(4, "Número de matrícula requerido"),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, "Formato CUIT inválido (XX-XXXXXXXX-X)"),
  specialty: z.string().min(2, "Especialidad requerida"),
});

type DoctorValues = z.infer<typeof doctorSchema>;

export function DoctorsSettings() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading } = useUsers({ role: "medico", size: 100 });
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DoctorValues>({ resolver: zodResolver(doctorSchema) });

  const doctors = (usersData?.items || []).filter((u) =>
    search
      ? u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const onSubmit = async (data: DoctorValues) => {
    try {
      // Se crea el usuario con el rol "medico" para que aparezca en los selects del flujo  
      await createUser.mutateAsync({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: "Temp1234!", // contraseña temporal — el sistema obliga el cambio en primer login
        role_names: ["medico"],
      });
      toast.success(`Médico ${data.full_name} registrado correctamente. Contraseña temporal: Temp1234!`);
      setShowModal(false);
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al médico ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success(`Médico ${name} eliminado.`);
    } catch {
      toast.error("Error al eliminar el médico.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Directorio Médico</h2>
          <p className="text-sm text-gray-500 mt-1">
            Cada médico registrado aquí tendrá acceso al portal de validación.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Médico
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
              className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Nombre Completo</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Teléfono</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Cargando médicos...
                  </td>
                </tr>
              )}
              {!isLoading && doctors.map((doc) => (
                <tr key={doc.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    Dr/a. {doc.full_name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{doc.email}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.phone || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      doc.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {doc.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(doc.id, doc.full_name)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1 ml-2"
                      title="Eliminar médico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && doctors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay médicos registrados. Añadí uno con el botón de arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alta Médico */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Dar de Alta Médico</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Se creará un usuario con acceso al Portal de Validación Médica.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nombre Completo *</label>
                  <input
                    {...register("full_name")}
                    placeholder="Dra. María García"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email de acceso *</label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="medico@clinica.com"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    {...register("phone")}
                    placeholder="+54 11 xxxx xxxx"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">CUIT *</label>
                  <input
                    {...register("cuit")}
                    placeholder="XX-XXXXXXXX-X"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.cuit && <p className="text-xs text-red-500">{errors.cuit.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Matrícula *</label>
                  <input
                    {...register("matricula")}
                    placeholder="MN 00000"
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.matricula && <p className="text-xs text-red-500">{errors.matricula.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Especialidad *</label>
                  <select
                    {...register("specialty")}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona especialidad...</option>
                    <option value="Hematología General">Hematología General</option>
                    <option value="Oncohematología">Oncohematología</option>
                    <option value="Hemoterapia">Hemoterapia</option>
                    <option value="Medicina Interna">Medicina Interna</option>
                  </select>
                  {errors.specialty && <p className="text-xs text-red-500">{errors.specialty.message}</p>}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-700">
                  <strong>Contraseña temporal:</strong> <code className="bg-blue-100 px-1 rounded">Temp1234!</code> — El médico deberá cambiarla al primer ingreso al portal.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createUser.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {createUser.isPending ? "Registrando..." : "Guardar Médico"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
