export default function ServicesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v10.5a3.5 3.5 0 007 0V3M9 3h6M9 3H7m8 0h2" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Prestaciones</h1>
      <p className="text-gray-500 max-w-md"> Esta sección se encuentra actualmente en desarrollo. Aquí podrás configurar y gestionar las prestaciones de hematología. </p>
    </div>
  );
}
