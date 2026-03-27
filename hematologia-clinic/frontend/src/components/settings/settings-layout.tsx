"use client";

import { useState } from "react";
import { CompanySettings } from "./company-settings";
import { DoctorsSettings } from "./doctors-settings";
import { TechniciansSettings } from "./technicians-settings";
import { RolesPermissions } from "./roles-permissions";

type TabValue = "company" | "doctors" | "technicians" | "roles";

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const StethoscopeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const MicroscopeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26 1.26 3.314 0 4.574m-12 0c-.82 0-1.572-.326-2.126-.855" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState<TabValue>("company");

  const tabs = [
    { id: "company", label: "Empresa", icon: BuildingIcon },
    { id: "doctors", label: "Médicos", icon: StethoscopeIcon },
    { id: "technicians", label: "Técnicos Hematólogos", icon: MicroscopeIcon },
    { id: "roles", label: "Roles y Permisos", icon: ShieldIcon },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row h-full rounded-xl overflow-hidden">
      {/* Sidebar de Configuración */}
      <aside className="w-full md:w-64 bg-gray-50 border-r border-gray-100 flex-shrink-0 p-4">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Contenido Dinámico */}
      <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
        {activeTab === "company" && <CompanySettings />}
        {activeTab === "doctors" && <DoctorsSettings />}
        {activeTab === "technicians" && <TechniciansSettings />}
        {activeTab === "roles" && <RolesPermissions />}
      </div>
    </div>
  );
}
