"use client";

import { REPORT_TYPE_LABELS } from "@/types/reports";

interface Props {
  report: any;
}

export function ReportPrintView({ report }: Props) {
  if (!report) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="print-view bg-white p-8 max-w-[800px] mx-auto text-gray-900 font-sans border border-gray-100 shadow-lg print:shadow-none print:border-none print:p-0">
      {/* Header Clínica */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Clínica de Hematología</h1>
          <p className="text-xs text-gray-500 italic">Excelencia en diagnóstico hematológico</p>
        </div>
        <div className="text-right text-[10px] text-gray-400 leading-tight">
          <p>Av. Principal 1234, Ciudad</p>
          <p>Tel: (011) 4567-8900</p>
          <p>www.hematologia-clinic.com.ar</p>
        </div>
      </div>

      {/* Título del Informe */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold uppercase tracking-widest text-gray-800">
          Informe de {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
        </h2>
        {report.is_corrected && (
          <span className="text-xs font-semibold text-orange-600 border border-orange-200 bg-orange-50 px-2 py-0.5 rounded uppercase mt-1 inline-block">
            Documento Corregido v{report.version}
          </span>
        )}
      </div>

      {/* Datos del Paciente */}
      <div className="grid grid-cols-2 gap-y-2 text-sm bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Paciente</p>
          <p className="font-semibold text-base">{report.patient?.full_name || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">DNI / HC</p>
          <p className="font-semibold text-base">{report.patient?.dni || report.patient?.medical_record_number || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Fecha de Atención</p>
          <p className="font-medium">{formatDate(report.service?.performed_at || report.created_at)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">ID Informe</p>
          <p className="font-mono text-xs text-gray-400">{report.id.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Resultados */}
      <div className="mb-12">
        <h3 className="text-xs font-bold uppercase text-gray-400 border-b border-gray-100 mb-4 pb-1">Resultados Analíticos</h3>
        <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap min-h-[300px]">
          {typeof report.content === "string" ? (
            report.content
          ) : report.content?.text ? (
            report.content.text
          ) : (
            <div className="space-y-4">
              {report.content?.resultados && Object.entries(report.content.resultados).length > 0 ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  {Object.entries(report.content.resultados).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex justify-between border-b border-dotted border-gray-200 pb-0.5">
                      <span className="font-medium text-gray-600 capitalize">{key.replace(/_/g, " ")}:</span>
                      <span className="font-bold">{val}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {report.content?.observaciones && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Observaciones</p>
                  <p className="italic text-gray-700">{report.content.observaciones}</p>
                </div>
              )}
              {report.content?.conclusiones && (
                <div className="mt-4 p-2 bg-gray-50 rounded border-l-4 border-primary">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Conclusiones Médicas</p>
                  <p className="font-medium">{report.content.conclusiones}</p>
                </div>
              )}
              {!report.content?.resultados && !report.content?.observaciones && !report.content?.conclusiones && (
                <span className="text-gray-300 italic">Sin resultados registrados.</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bloque de Firmas */}
      <div className="grid grid-cols-2 gap-12 pt-12 mt-12 border-t border-gray-100">
        {/* Firma Técnico */}
        <div className="text-center">
          <div className="h-20 flex items-end justify-center mb-2">
             <p className="text-xs italic text-gray-300">Firma del Personal Técnico</p>
          </div>
          <div className="border-t border-gray-400 pt-2">
            <p className="font-bold text-sm uppercase">{report.service?.performed_by?.full_name || "—"}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Técnico a cargo de la práctica</p>
          </div>
        </div>

        {/* Firma Médico */}
        <div className="text-center">
          <div className="h-20 flex flex-col items-center justify-end mb-2">
            {report.status === "firmado" || report.status === "entregado" ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded px-4 py-1 rotate-[-2deg] mb-2">
                <p className="text-blue-700 font-serif text-lg font-bold leading-none">FIRMADO DIGITALMENTE</p>
                <p className="text-blue-500 text-[8px] font-sans uppercase">Validación Médica Confirmada</p>
              </div>
            ) : (
              <p className="text-xs italic text-gray-300">Pendiente de Firma</p>
            )}
          </div>
          <div className="border-t border-gray-400 pt-2">
            <p className="font-bold text-sm uppercase">{report.signed_by?.full_name || "—"}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium text-wrap">Médico Hematólogo / Validador</p>
          </div>
        </div>
      </div>

      {/* Footer Legal */}
      <div className="mt-16 text-center text-[8px] text-gray-400 uppercase tracking-widest">
        <p>Este documento es un informe médico oficial. La firma digital ha sido validada internamente por el sistema de gestión de la clínica.</p>
        <p className="mt-1">Página 1 de 1</p>
      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-view, .print-view * {
            visibility: visible;
          }
          .print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 2cm;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
