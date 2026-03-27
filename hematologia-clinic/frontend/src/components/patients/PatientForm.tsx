"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreatePatient, useUpdatePatient } from "@/hooks/use-patients";
import type { Patient } from "@/types/patients";

const patientSchema = z.object({
  first_name: z.string().min(1, "Requerido").max(100),
  last_name: z.string().min(1, "Requerido").max(100),
  dni: z.string().min(6, "DNI inválido").max(20),
  birth_date: z.string().min(1, "Requerido"),
  sex: z.enum(["M", "F", "Otro"]),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
  phone_alt: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_plan: z.string().optional(),
  insurance_number: z.string().optional(),
  blood_type: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface Props {
  mode: "create" | "edit";
  patient?: Patient;
}

function FormField({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

export function PatientForm({ mode, patient }: Props) {
  const router = useRouter();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient(patient?.id || "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient
      ? {
          first_name: patient.first_name,
          last_name: patient.last_name,
          dni: patient.dni,
          birth_date: patient.birth_date,
          sex: patient.sex,
          address: patient.address || "",
          city: patient.city || "",
          province: patient.province || "",
          phone: patient.phone || "",
          phone_alt: patient.phone_alt || "",
          email: patient.email || "",
          emergency_contact_name: patient.emergency_contact_name || "",
          emergency_contact_phone: patient.emergency_contact_phone || "",
          emergency_contact_relationship: patient.emergency_contact_relationship || "",
          insurance_provider: patient.insurance_provider || "",
          insurance_plan: patient.insurance_plan || "",
          insurance_number: patient.insurance_number || "",
          blood_type: patient.blood_type || "",
        }
      : { sex: "M" },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      const payload = {
        ...data,
        email: data.email || undefined,
      };

      if (mode === "create") {
        const created = await createMutation.mutateAsync(payload);
        toast.success(`Paciente ${created.full_name} registrado. Redirigiendo a asignación de turno...`);
        router.push(`/dashboard/appointments/new?patient_id=${created.id}`);
      } else {
        await updateMutation.mutateAsync(payload);
        toast.success("Datos actualizados correctamente");
        router.push(`/dashboard/patients/${patient!.id}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Sección: Datos Personales */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Datos Personales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Apellido" error={errors.last_name?.message} required>
            <input {...register("last_name")} className={inputClass} placeholder="García" />
          </FormField>
          <FormField label="Nombre" error={errors.first_name?.message} required>
            <input {...register("first_name")} className={inputClass} placeholder="María" />
          </FormField>
          <FormField label="DNI" error={errors.dni?.message} required>
            <input {...register("dni")} className={inputClass} placeholder="30.123.456" />
          </FormField>
          <FormField label="Fecha de nacimiento" error={errors.birth_date?.message} required>
            <input {...register("birth_date")} type="date" className={inputClass} />
          </FormField>
          <FormField label="Sexo" error={errors.sex?.message} required>
            <select {...register("sex")} className={inputClass}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </FormField>
          <FormField label="Grupo sanguíneo" error={errors.blood_type?.message}>
            <select {...register("blood_type")} className={inputClass}>
              <option value="">— Sin definir —</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {/* Sección: Datos de Contacto */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Contacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <FormField label="Dirección" error={errors.address?.message}>
              <input {...register("address")} className={inputClass} placeholder="Av. Corrientes 1234" />
            </FormField>
          </div>
          <FormField label="Ciudad" error={errors.city?.message}>
            <input {...register("city")} className={inputClass} placeholder="Buenos Aires" />
          </FormField>
          <FormField label="Provincia" error={errors.province?.message}>
            <input {...register("province")} className={inputClass} placeholder="Buenos Aires" />
          </FormField>
          <FormField label="Teléfono" error={errors.phone?.message}>
            <input {...register("phone")} className={inputClass} placeholder="11-2233-4455" />
          </FormField>
          <FormField label="Teléfono alternativo" error={errors.phone_alt?.message}>
            <input {...register("phone_alt")} className={inputClass} placeholder="11-6677-8899" />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" className={inputClass} placeholder="paciente@email.com" />
          </FormField>
        </div>
      </section>

      {/* Sección: Contacto de Emergencia */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Contacto de Emergencia</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Nombre" error={errors.emergency_contact_name?.message}>
            <input {...register("emergency_contact_name")} className={inputClass} placeholder="Juan García" />
          </FormField>
          <FormField label="Teléfono" error={errors.emergency_contact_phone?.message}>
            <input {...register("emergency_contact_phone")} className={inputClass} placeholder="11-1234-5678" />
          </FormField>
          <FormField label="Relación" error={errors.emergency_contact_relationship?.message}>
            <input {...register("emergency_contact_relationship")} className={inputClass} placeholder="Hijo/a, cónyuge..." />
          </FormField>
        </div>
      </section>

      {/* Sección: Cobertura Médica */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Cobertura Médica</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Obra Social" error={errors.insurance_provider?.message}>
            <input {...register("insurance_provider")} className={inputClass} placeholder="OSDE, PAMI, Swiss Medical..." />
          </FormField>
          <FormField label="Plan" error={errors.insurance_plan?.message}>
            <input {...register("insurance_plan")} className={inputClass} placeholder="Plan 310, 410..." />
          </FormField>
          <FormField label="Número de afiliado" error={errors.insurance_number?.message}>
            <input {...register("insurance_number")} className={inputClass} placeholder="0001234567" />
          </FormField>
        </div>
      </section>

      {/* Botones */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? "Guardando..."
            : mode === "create"
            ? "Registrar Paciente"
            : "Guardar Cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
