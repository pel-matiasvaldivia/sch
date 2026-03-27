import { SettingsLayout } from "@/components/settings/settings-layout";

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-1">
          Administra la información de la clínica, alta de médicos, técnicos y permisos de usuarios.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
        <SettingsLayout />
      </div>
    </div>
  );
}
