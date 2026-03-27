"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateService } from "@/hooks/use-services";
import { useSearchPatients, usePatient } from "@/hooks/use-patients";
import { useUsers } from "@/hooks/use-users";
import type { MedicalServiceCreate, ServiceLocation, ServiceType } from "@/types/services";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const schema = z.object({
  patient_id: z.string().min(1, "Seleccioná un paciente"),
  service_type: z.string().min(1, "Seleccioná el tipo de prestación"),
  location: z.string().min(1, "Seleccioná la ubicación"),
  clinical_observations: z.string().optional(),
  requested_by_id: z.string().optional(),
  performed_by_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultPatientId?: string;
  defaultPatientName?: string;
}

export function ServiceForm({ defaultPatientId, defaultPatientName }: Props) {
  const router = useRouter();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState(defaultPatientName ?? "");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: patientResults } = useSearchPatients(patientSearch);
  const { data: defaultPatient } = usePatient(defaultPatientId || "");
  const { data: doctorsData } = useUsers({ role: "medico", size: 100 });
  const { data: techniciansData } = useUsers({ role: "tecnico", size: 100 });
  const createMutation = useCreateService();

  const doctors = doctorsData?.items ?? [];
  const technicians = techniciansData?.items ?? [];

  const searchParams = useSearchParams();
  const urlServiceType = searchParams.get("service_type") as ServiceType | null;
  const urlProfessionalId = searchParams.get("professional_id");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: defaultPatientId ?? "",
      location: "clinica",
      service_type: urlServiceType ?? "",
      requested_by_id: urlServiceType && ["consulta_medica", "hematologia"].includes(urlServiceType) ? urlProfessionalId ?? "" : "",
      performed_by_id: urlServiceType && !["consulta_medica", "hematologia"].includes(urlServiceType) ? urlProfessionalId ?? "" : "",
    },
  });

  const selectedServiceType = watch("service_type");
  const isMedicalService = ["consulta_medica", "hematologia"].includes(selectedServiceType);
  const isTechnicalService = ["laboratorio", "extraccion", "coagulacion", "puncion", "infusion"].includes(selectedServiceType);

  // Sincronizar si cambian los params de URL (útil si se navega entre perfiles)
  useEffect(() => {
    if (urlServiceType) setValue("service_type", urlServiceType);
    if (urlProfessionalId) {
      if (isMedicalService) setValue("requested_by_id", urlProfessionalId);
      if (isTechnicalService) setValue("performed_by_id", urlProfessionalId);
    }
  }, [urlServiceType, urlProfessionalId, isMedicalService, isTechnicalService, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({
        patient_id: data.patient_id,
        service_type: data.service_type as ServiceType,
        location: data.location as ServiceLocation,
        clinical_observations: data.clinical_observations || undefined,
        requested_by_id: data.requested_by_id || undefined,
        performed_by_id: data.performed_by_id || undefined,
      } as MedicalServiceCreate);
      toast.success("Prestación registrada correctamente");
      router.push("/dashboard/services");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar la prestación");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
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
            Registrar paciente nuevo
          </Link>
        </div>
        <div className="relative">
          <input
            type="text"
            value={
              defaultPatientId
                ? defaultPatient
                  ? `${defaultPatient.full_name} — DNI ${defaultPatient.dni}`
                  : "Cargando paciente vinculado..."
                : selectedPatientName || patientSearch
            }
            onChange={(e) => {
              if (defaultPatientId) return;
              setPatientSearch(e.target.value);
              setSelectedPatientName("");
              setValue("patient_id", "");
              setShowDropdown(true);
            }}
            onFocus={() => !defaultPatientId && setShowDropdown(true)}
            disabled={!!defaultPatientId}
            placeholder="Buscar por nombre, apellido o DNI..."
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
              defaultPatientId
                ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                : "border-gray-300"
            }`}
          />
          {showDropdown && patientResults?.items && patientResults.items.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
              {patientResults.items.map((p) => (
                <li
                  key={p.id}
                  onClick={() => {
                    setValue("patient_id", p.id);
                    setSelectedPatientName(`${p.full_name} — DNI ${p.dni}`);
                    setPatientSearch("");
                    setShowDropdown(false);
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

      {/* Tipo de prestación y Ubicación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de prestación <span className="text-red-500">*</span>
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
        </div>
      </div>

      {/* Profesionales Médicos o Técnicos según el tipo */}
      <div className="grid grid-cols-1 gap-4">
        {isMedicalService && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Médico Responsable / Solicitante <span className="text-red-500">*</span>
            </label>
            <select
              {...register("requested_by_id")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
            >
              <option value="">Seleccioná médico...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
        )}

        {isTechnicalService && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Técnico Hematólogo Responsable <span className="text-red-500">*</span>
            </label>
            <select
              {...register("performed_by_id")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
            >
              <option value="">Seleccioná técnico...</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Observaciones clínicas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones clínicas
        </label>
        <textarea
          {...register("clinical_observations")}
          rows={4}
          placeholder="Indicaciones, antecedentes relevantes, notas para el técnico..."
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
          {createMutation.isPending ? "Guardando..." : "Registrar Prestación"}
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
