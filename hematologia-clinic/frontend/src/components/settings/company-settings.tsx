"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, UploadCloud } from "lucide-react";
import { toast } from "sonner"; // If they use sonner (in package.json)

const companySchema = z.object({
  clinicName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  legalName: z.string().min(2, "La razón social es requerida"),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, "Formato inválido (Ej: 30-12345678-9)"),
  address: z.string().min(5, "Dirección requerida"),
  phone: z.string().min(6, "Teléfono requerido"),
  email: z.string().email("Email inválido"),
});

type CompanyValues = z.infer<typeof companySchema>;

export function CompanySettings() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      clinicName: "Hematología Clinic",
      legalName: "Salud Integral S.A.",
      cuit: "30-12345678-9",
      address: "Av. Corrientes 1234, CABA",
      phone: "+54 11 4321-1234",
      email: "contacto@hematologiaclinic.com.ar",
    },
  });

  const onSubmit = async (data: CompanyValues) => {
    // Simulando guardado
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log("Guardado:", data);
    toast.success("Datos de la empresa guardados correctamente.");
  };

  return (
    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">Datos de la Empresa y Fiscales</h2>
        <p className="text-sm text-gray-500 mt-1">
          Información general de la clínica que aparecerá en reportes, facturas y portal de pacientes de Argentina.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* LOGO UPLOAD */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Logo Institucional</h3>
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
              <span className="text-xs text-gray-400 font-medium">Logo</span>
            </div>
            <div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-transparent hover:bg-gray-100 px-4 py-2"
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                Subir nuevo logo
              </button>
              <p className="text-xs text-gray-500 mt-2">Recomendado: Cuadrado, máximo 2MB (JPG o PNG).</p>
            </div>
          </div>
        </section>

        {/* DATOS GENERALES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nombre Comercial de la Clínica</label>
            <input
              {...register("clinicName")}
              placeholder="Ej: Hematología Clinic"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.clinicName && <p className="text-xs text-red-500">{errors.clinicName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Administrativo</label>
            <input
              {...register("email")}
              type="email"
              placeholder="contacto@clinica.com"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Razón Social</label>
            <input
              {...register("legalName")}
              placeholder="Ej: Clinica S.A."
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.legalName && <p className="text-xs text-red-500">{errors.legalName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">CUIT (Argentina)</label>
            <input
              {...register("cuit")}
              placeholder="XX-XXXXXXXX-X"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.cuit && <p className="text-xs text-red-500">{errors.cuit.message}</p>}
          </div>

          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-gray-700">Dirección Completa</label>
            <input
              {...register("address")}
              placeholder="Calle, Ciudad, Provincia, Código Postal"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>
          
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-gray-700">Teléfono Principal</label>
            <input
              {...register("phone")}
              placeholder="+54 11 0000 0000"
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>
        </section>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
