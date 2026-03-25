import type { Metadata } from "next";
import { ReportListClient } from "@/components/reports/ReportListClient";

export const metadata: Metadata = { title: "Informes" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Informes</h1>
        <p className="text-muted-foreground">
          Gestión de informes médicos de pacientes
        </p>
      </div>
      <ReportListClient />
    </div>
  );
}
