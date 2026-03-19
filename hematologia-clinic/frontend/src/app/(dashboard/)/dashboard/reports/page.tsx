export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Informes</h1>
      <p className="text-gray-500 max-w-md"> Esta sección se encuentra actualmente en desarrollo. Pronto podrás generar y consultar informes clínicos detallados. </p>
    </div>
  );
}
