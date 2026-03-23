"use client";

interface Props {
  section?: string;
}

export function AccessDenied({ section }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Acceso restringido</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        No tenés permiso para acceder{section ? ` a ${section}` : " a esta sección"}.
        <br />
        Si necesitás acceso, contactá al administrador del sistema.
      </p>
    </div>
  );
}
