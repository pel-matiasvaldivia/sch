import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export const metadata = {
  title: "Cambiar Contraseña | Sistema Hematología",
  description: "Actualizá tu contraseña por seguridad.",
};

export default function ChangePasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-slate-50/50">
      <ChangePasswordForm />
    </div>
  );
}
