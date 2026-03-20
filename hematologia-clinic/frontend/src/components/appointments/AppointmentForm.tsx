"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { useSearchPatients } from "@/hooks/use-patients";
import { useUsers } from "@/hooks/use-users";
import type { AppointmentCreate, AppointmentLocation, ServiceType } from "@/types/appointments";

const schema = z.object({
  patient_id: z.string().min(1, "Seleccioná un paciente"),
  doctor_id: z.string().min(1, "Seleccioná un médico"),
  service_type: z.string().min(1, "Seleccioná el tipo de servicio"),
  scheduled_date: z.string().min(1, "Seleccioná la fecha"),
  scheduled_time: z.string().min(1, "Seleccioná la hora"),
  duration_minutes: z.coerce.number().min(5).max(480),
  location: z.string().min(1, "Seleccioná la ubicación"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AppointmentForm() {
  const router = useRouter();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const { data: patientResults } = useSearchPatients(patientSearch);
  const { data: usersData } = useUsers({ role: "medico", size: 100 });
  const createMutation = useCreateAppointment();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration_minutes: 30, location: "clinica", scheduled_time: "09:00" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const scheduled_at = `${data.scheduled_date}T${data.scheduled_time}:00`;
      const { scheduled_date, scheduled_time, ...rest } = data;
      await createMutation.mutateAsync({ ...rest, scheduled_at } as AppointmentCreate);
      toast.success("Turno creado correctamente");
      router.push("/dashboard/appointments");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el turno");
    }
  };

  const doctors = usersData?.items ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Paciente */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Paciente <span className="text-red-500">*</span>
          </label>
          <Link
            href="/dashboard/patients/new"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Paciente no registrado aún
          </Link>
        </div>
        <div className="relative">
          <input
            type="text"
            value={selectedPatientName || patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              setSelectedPatientName("");
              setValue("patient_id", "");
              setShowPatientDropdown(true);
            }}
            onFocus={() => setShowPatientDropdown(true)}
            placeholder="Buscar por nombre, apellido o DNI..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          {showPatientDropdown && patientResults?.items && patientResults.items.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
              {patientResults.items.map((p) => (
                <li
                  key={p.id}
                  onClick={() => {
                    setValue("patient_id", p.id);
                    setSelectedPatientName(`${p.full_name} — DNI ${p.dni}`);
                    setPatientSearch("");
                    setShowPatientDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <span className="font-medium">{p.full_name}</span>
                  <span className="text-gray-500 ml-2">DNI {p.dni}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {errors.patient_id && (
          <p className="text-xs text-red-600 mt-1">{errors.patient_id.message}</p>
        )}
      </div>

      {/* Médico */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Médico <span className="text-red-500">*</span>
        </label>
        <select
          {...register("doctor_id")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
        >
          <option value="">Seleccioná un médico</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
            </option>
          ))}
        </select>
        {errors.doctor_id && (
          <p className="text-xs text-red-600 mt-1">{errors.doctor_id.message}</p>
        )}
      </div>

      {/* Tipo de servicio y Ubicación */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de servicio <span className="text-red-500">*</span>
          </label>
          <select
            {...register("service_type")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
          >
            <option value="">Seleccioná</option>
            <option value="consulta_medica">Consulta Médica</option>
            <option value="hematologia">Hematología</option>
            <option value="coagulacion">Coagulación</option>
            <option value="puncion">Punción</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="infusion">Infusión</option>
          </select>
          {errors.service_type && (
            <p className="text-xs text-red-600 mt-1">{errors.service_type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación <span className="text-red-500">*</span>
          </label>
          <select
            {...register("location")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
          >
            <option value="clinica">Clínica</option>
            <option value="hospital">Hospital</option>
            <option value="geriatrico">Geriátrico</option>
            <option value="domicilio">Domicilio</option>
          </select>
          {errors.location && (
            <p className="text-xs text-red-600 mt-1">{errors.location.message}</p>
          )}
        </div>
      </div>

      {/* Fecha, Hora y Duración */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha (Mes/Día/Año) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("scheduled_date")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          {errors.scheduled_date && (
            <p className="text-xs text-red-600 mt-1">{errors.scheduled_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora (HH:MM) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("scheduled_time")}
            type="time"
            step="60"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          {errors.scheduled_time && (
            <p className="text-xs text-red-600 mt-1">{errors.scheduled_time.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duración (min)
          </label>
          <input
            {...register("duration_minutes")}
            type="number"
            min={5}
            max={480}
            step={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          {errors.duration_minutes && (
            <p className="text-xs text-red-600 mt-1">{errors.duration_minutes.message}</p>
          )}
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Indicaciones o notas para el turno..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? "Guardando..." : "Crear Turno"}
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
