"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "La contraseña actual es requerida"),
  new_password: z.string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirm_password: z.string().min(1, "Debes confirmar la contraseña"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const { changePassword, isChangePasswordLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordData) => {
    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      router.push("/dashboard");
    } catch (error) {
      // El error ya es manejado por el hook con un toast
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Actualizar Contraseña</h2>
        <p className="text-sm text-gray-500 mt-2 italic">
          Por seguridad, debés cambiar tu contraseña inicial antes de continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Contraseña Actual
          </label>
          <input
            {...register("current_password")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-gray-50/50"
          />
          {errors.current_password && (
            <p className="text-xs text-red-600 mt-1">{errors.current_password.message}</p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nueva Contraseña
          </label>
          <input
            {...register("new_password")}
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-gray-50/50"
          />
          {errors.new_password && (
            <p className="text-xs text-red-600 mt-1">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Confirmar Nueva Contraseña
          </label>
          <input
            {...register("confirm_password")}
            type="password"
            autoComplete="new-password"
            placeholder="Repetí la nueva contraseña"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-gray-50/50"
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-600 mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isChangePasswordLoading}
          className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold text-sm hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-4"
        >
          {isChangePasswordLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Actualizando...
            </span>
          ) : (
            "Actualizar y Continuar"
          )}
        </button>
      </form>
    </div>
  );
}
