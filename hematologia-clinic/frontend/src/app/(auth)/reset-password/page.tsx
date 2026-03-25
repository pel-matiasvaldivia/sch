import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nueva contraseña",
};

interface Props {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: Props) {
  const token = searchParams.token ?? "";
  return <ResetPasswordForm token={token} />;
}
