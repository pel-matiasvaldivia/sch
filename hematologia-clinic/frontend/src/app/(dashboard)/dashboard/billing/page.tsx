import type { Metadata } from "next";
import { InvoiceListClient } from "@/components/billing/InvoiceListClient";

export const metadata: Metadata = { title: "Facturación" };

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        <p className="text-muted-foreground">
          Gestión de facturas y pagos de pacientes
        </p>
      </div>
      <InvoiceListClient />
    </div>
  );
}
