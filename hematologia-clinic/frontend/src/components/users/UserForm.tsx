"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { ALL_ROLES, ROLE_LABELS, type UserRead } from "@/types/users";
import { useAuthStore } from "@/stores/auth-store";

const schema = z
  .object({
    full_name: z.string().min(2, "Mínimo 2 caracteres").max(255),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().max(20).optional().or(z.literal("")),
    password: z.string().optional().or(z.literal("")),
    is_active: z.boolean().optional(),
    role_names: z.array(z.string()).min(1, "Asigná al menos un rol"),
    // Campos de paciente
    first_name: z.string().max(100).optional().or(z.literal("")),
    last_name: z.string().max(100).optional().or(z.literal("")),
    dni: z.string().max(20).optional().or(z.literal("")),
    birth_date: z.string().optional().or(z.literal("")),
    sex: z.enum(["M", "F", "Otro"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role_names.includes("paciente")) {
      if (!data.first_name || data.first_name.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["first_name"], message: "Requerido para rol paciente" });
      }
      if (!data.last_name || data.last_name.trim().length < 1) {
        ctx.addIssue({ code: "custom", path: ["last_name"], message: "Requerido para rol paciente" });
      }
      if (!data.dni || data.dni.trim().length < 6) {
        ctx.addIssue({ code: "custom", path: ["dni"], message: "DNI requerido para rol paciente" });
      }
      if (!data.birth_date) {
        ctx.addIssue({ code: "custom", path: ["birth_date"], message: "Requerido para rol paciente" });
      }
      if (!data.sex) {
        ctx.addIssue({ code: "custom", path: ["sex"], message: "Requerido para rol paciente" });
      }
    }
  });

type FormData = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  user?: UserRead;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

export function UserForm({ mode, user }: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isEditingSelf = isEdit && !!currentUser && user?.id === currentUser.id;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(user?.id ?? "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit && user
      ? {
          full_name: user.full_name,
          email: user.email,
          phone: user.phone ?? "",
          password: "",
          is_active: user.is_active,
          role_names: user.roles.map((r) => r.name),
        }
      : {
          full_name: "",
          email: "",
          phone: "",
          password: "",
          is_active: true,
          role_names: ["medico"],
        },
  });

  const selectedRoles = watch("role_names") ?? [];
  const isPaciente = selectedRoles.includes("paciente");

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setValue("role_names", selectedRoles.filter((r) => r !== role), { shouldValidate: true });
    } else {
      setValue("role_names", [...selectedRoles, role], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && user) {
        await updateMutation.mutateAsync({
          full_name: data.full_name,
          phone: data.phone || undefined,
          is_active: data.is_active,
          role_names: data.role_names,
        });
        if (isEditingSelf) {
          toast.success("Tus datos fueron actualizados. Iniciá sesión nuevamente para aplicar los cambios.");
          setTimeout(() => logout(), 1500);
        } else {
          toast.success("Usuario actualizado correctamente");
          router.push("/dashboard/users");
        }
      } else {
        if (!data.email) {
          toast.error("El email es requerido");
          return;
        }
        if (!data.password || data.password.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres");
          return;
        }
        if (!/[A-Z]/.test(data.password)) {
          toast.error("La contraseña debe tener al menos una mayúscula");
          return;
        }
        if (!/[0-9]/.test(data.password)) {
          toast.error("La contraseña debe tener al menos un número");
          return;
        }
        await createMutation.mutateAsync({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || undefined,
          password: data.password,
          role_names: data.role_names,
          ...(isPaciente && {
            first_name: data.first_name || undefined,
            last_name: data.last_name || undefined,
            dni: data.dni || undefined,
            birth_date: data.birth_date || undefined,
            sex: data.sex,
          }),
        });
        toast.success("Usuario creado correctamente");
        router.push("/dashboard/users");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar el usuario");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      {/* Aviso si editás tu propio usuario */}
      {isEditingSelf && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            Estás editando tu propia cuenta. Si modificás los roles o desactivás tu usuario,
            se cerrará la sesión automáticamente al guardar.
          </span>
        </div>
      )}

      {/* Nombre completo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <input
          {...register("full_name")}
          type="text"
          placeholder="Ej: María García"
          className={inputClass}
        />
        {errors.full_name && (
          <p className="text-xs text-red-600 mt-1">{errors.full_name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email {!isEdit && <span className="text-red-500">*</span>}
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="usuario@clinica.com"
          disabled={isEdit}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
            isEdit
              ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              : "border-gray-300"
          }`}
        />
        {errors.email && (
          <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
        <input
          {...register("phone")}
          type="tel"
          placeholder="Ej: +54 9 11 1234-5678"
          className={inputClass}
        />
      </div>

      {/* Contraseña (solo creación) */}
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
          </p>
        </div>
      )}

      {/* Estado activo (solo edición) */}
      {isEdit && (
        <div className="flex items-center gap-3">
          <input
            {...register("is_active")}
            type="checkbox"
            id="is_active"
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Usuario activo
          </label>
        </div>
      )}

      {/* Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Roles <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => {
            const isSelected = selectedRoles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  isSelected
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-300 hover:border-primary/50 hover:text-primary"
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
        {errors.role_names && (
          <p className="text-xs text-red-600 mt-1">{errors.role_names.message}</p>
        )}
      </div>

      {/* Campos de paciente — solo visibles si rol paciente está seleccionado y es creación */}
      {isPaciente && !isEdit && (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-4">
          <p className="text-sm font-medium text-blue-800">
            Datos del paciente — requeridos para el rol Paciente
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                {...register("last_name")}
                type="text"
                placeholder="García"
                className={inputClass}
              />
              {errors.last_name && (
                <p className="text-xs text-red-600 mt-1">{errors.last_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...register("first_name")}
                type="text"
                placeholder="María"
                className={inputClass}
              />
              {errors.first_name && (
                <p className="text-xs text-red-600 mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI <span className="text-red-500">*</span>
              </label>
              <input
                {...register("dni")}
                type="text"
                placeholder="30.123.456"
                className={inputClass}
              />
              {errors.dni && (
                <p className="text-xs text-red-600 mt-1">{errors.dni.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                {...register("birth_date")}
                type="date"
                className={inputClass}
              />
              {errors.birth_date && (
                <p className="text-xs text-red-600 mt-1">{errors.birth_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo <span className="text-red-500">*</span>
              </label>
              <select {...register("sex")} className={inputClass}>
                <option value="">— Seleccionar —</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.sex && (
                <p className="text-xs text-red-600 mt-1">{errors.sex.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isPending}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
