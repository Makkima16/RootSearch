"use client";

import { useState } from "react";
import Link from "next/link";
import { LuMail } from "react-icons/lu";
import { forgotPassword } from "../../../services/users";
import Toast from "../../../components/Toast";
import Logo from "../../../components/Logo";
import { AuthField, AuthShell, AuthSubmit } from "../../../components/AuthUI";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type?: "info" | "success" | "error";
  }>({ show: false, message: "", type: "info" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await forgotPassword({ email });
      if (res.error) {
        setToast({ show: true, message: res.error, type: "error" });
      } else {
        setToast({
          show: true,
          message: res.message || "Revisa tu correo para continuar",
          type: "success",
        });
      }
    } catch {
      setToast({
        show: true,
        message: "Error al solicitar la recuperación",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Logo size={56} variant="principal" className="mb-6" />
      <h2 className="mb-2 text-3xl font-semibold text-white">Recuperar contraseña</h2>
      <p className="mb-6 text-sm text-rs-150">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          icon={LuMail}
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={setEmail}
        />
        <AuthSubmit loading={loading} label="Enviar enlace" loadingLabel="Enviando..." />
      </form>

      <p className="mt-6 text-center text-sm text-rs-150">
        <Link href="/auth/login" className="font-semibold text-rs-lime hover:text-[#dceba0]">
          Volver al inicio de sesión
        </Link>
      </p>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </AuthShell>
  );
}
