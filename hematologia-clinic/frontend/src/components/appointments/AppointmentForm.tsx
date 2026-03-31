"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateAppointment, useUpdateAppointment } from "@/hooks/use-appointments";
import { useSearchPatients, usePatient } from "@/hooks/use-patients";
import { useUsers } from "@/hooks/use-users";
import type { Appointment, AppointmentCreate, AppointmentUpdate } from "@/types/appointments";

const schema = z.object({
  patient_id: z.string().min(1, "Seleccioná un paciente"),
  doctor_id: z.string().min(1, "Seleccioná un profesional"),
  service_type: z.string().min(1, "Seleccioná el tipo de servicio"),
  scheduled_date: z.string().min(1, "Seleccioná la fecha"),
  scheduled_time: z.string().min(1, "Seleccioná la hora"),
  duration_minutes: z.coerce.number().min(5).max(480),
  location: z.string().min(1, "Seleccioná la ubicación"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultPatientId?: string;
  mode?: "create" | "edit";
  appointment?: Appointment;
}

function parseScheduledAt(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  const date = d.toISOString().split("T")[0];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return { date, time: `${hours}:${minutes}` };
}

export function AppointmentForm({ defaultPatientId, mode = "create", appointment }: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const { data: patientResults } = useSearchPatients(patientSearch);
  const { data: defaultPatient } = usePatient(defaultPatientId || "");
  const { data: doctorsData } = useUsers({ role: "medico", size: 100 });
  const { data: techniciansData } = useUsers({ role: "tecnico", size: 100 });

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment(appointment?.id ?? "");

  const editDefaults = appointment
    ? (() => {
        const { date, time } = parseScheduledAt(appointment.scheduled_at);
        return {
          patient_id: appointment.patient?.id ?? appointment.patient_id,
          doctor_id: appointment.doctor?.id ?? "",
          service_type: appointment.service_type,
          scheduled_date: date,
          scheduled_time: time,
          duration_minutes: appointment.duration_minutes,
          location: appointment.location,
          notes: appointment.notes ?? "",
        };
      })()
    : undefined;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit && editDefaults
      ? editDefaults
      : {
          patient_id: defaultPatientId ?? "",
          duration_minutes: 30,
          location: "clinica",
          scheduled_time: "09:00",
          service_type: "consulta_medica",
        },
  });

  const selectedServiceType = watch("service_type");
  const isTechnicalService = ["laboratorio", "extraccion", "coagulacion", "puncion", "infusion"].includes(selectedServiceType);
  const professionals = isTechnicalService ? (techniciansData?.items ?? []) : (doctorsData?.items ?? []);
  const professionalLabel = isTechnicalService ? "Técnico" : "Médico";

  const onSubmit = async (data: FormData) => {
    try {
      const scheduled_at = `${data.scheduled_date}T${data.scheduled_time}:00`;

      if (isEdit) {
        const payload: AppointmentUpdate = {
          doctor_id: data.doctor_id,
          service_type: data.service_type as AppointmentUpdate["service_type"],
          scheduled_at,
          duration_minutes: data.duration_minutes,
          location: data.location as AppointmentUpdate["location"],
          notes: data.notes,
        };
        await updateMutation.mutateAsync(payload);
        toast.success("Turno actualizado correctamente");
        router.push("/dashboard/appointments");
      } else {
        const { scheduled_date, scheduled_time, ...rest } = data;
        await createMutation.mutateAsync({ ...rest, scheduled_at } as AppointmentCreate);
        toast.success("Turno creado correctamente. Generando prestación enlazada...");
        const params = new URLSearchParams({
          patient_id: data.patient_id,
          service_type: data.service_type,
          professional_id: data.doctor_id,
        });
        router.push(`/dashboard/services/new?${params.toString()}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Error al ${isEdit ? "actualizar" : "crear"} el turno`);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const patientDisplayValue = isEdit
    ? appointment?.patient
      ? `${appointment.patient.full_name} — DNI ${appointment.patient.dni}`
      : "Paciente"
    : defaultPatientId
      ? defaultPatient
        ? `${defaultPatient.full_name} — DNI ${defaultPatient.dni}`
        : "Cargando paciente..."
      : selectedPatientName || patientSearch;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Paciente */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Paciente <span className="text-red-500">*</span>
          </label>
          {!isEdit && (
            <Link
              href="/dashboard/patients/new"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Paciente no registrado aún
            </Link>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={patientDisplayValue}
            onChange={(e) => {
              if (isEdit || defaultPatientId) return;
              setPatientSearch(e.target.value);
              setSelectedPatientName("");
              setValue("patient_id", "");
              setShowPatientDropdown(true);
            }}
            onFocus={() => !isEdit && !defaultPatientId && setShowPatientDropdown(true)}
            disabled={isEdit || !!defaultPatientId}
            placeholder="Buscar por nombre o DNI..."
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
              isEdit || defaultPatientId
                ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                : "border-gray-300"
            }`}
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
            <option value="laboratorio">Laboratorio / Análisis</option>
            <option value="extraccion">Extracción</option>
            <option value="coagulacion">Coagulación</option>
            <option value="puncion">Punción</option>
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

      {/* Profesional */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {professionalLabel} <span className="text-red-500">*</span>
        </label>
        <select
          {...register("doctor_id")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
        >
          <option value="">Seleccioná un {professionalLabel.toLowerCase()}</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
        {errors.doctor_id && (
          <p className="text-xs text-red-600 mt-1">Seleccioná un profesional</p>
        )}
      </div>

      {/* Fecha, Hora y Duración */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha <span className="text-red-500">*</span>
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
            Hora <span className="text-red-500">*</span>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
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
          disabled={isSubmitting || isPending}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Turno"}
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
