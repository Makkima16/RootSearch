"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LuLock } from "react-icons/lu";
import { resetPassword } from "../../services/users";
import Toast from "../../components/Toast";
import Logo from "../../components/Logo";
import { AuthField, AuthShell, AuthSubmit } from "../../components/AuthUI";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type?: "info" | "success" | "error";
  }>({ show: false, message: "", type: "info" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setToast({
        show: true,
        message: "El enlace no contiene un token válido",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({
        show: true,
        message: "Las contraseñas no coinciden",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      if (res.error) {
        setToast({ show: true, message: res.error, type: "error" });
      } else {
        setToast({
          show: true,
          message: res.message || "Contraseña actualizada",
          type: "success",
        });
        setTimeout(() => router.push("/auth/login"), 1000);
      }
    } catch {
      setToast({
        show: true,
        message: "Error al restablecer la contraseña",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Logo size={56} variant="principal" className="mb-6" />
      <h2 className="mb-2 text-3xl font-semibold text-white">Nueva contraseña</h2>
      <p className="mb-6 text-sm text-rs-150">Define una nueva contraseña para tu cuenta.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="newPassword"
          label="Nueva contraseña"
          icon={LuLock}
          minLength={6}
          value={newPassword}
          onChange={setNewPassword}
          togglePassword
        />
        <AuthField
          id="confirmPassword"
          label="Confirmar contraseña"
          icon={LuLock}
          minLength={6}
          value={confirmPassword}
          onChange={setConfirmPassword}
          togglePassword
        />
        <AuthSubmit loading={loading} label="Actualizar contraseña" loadingLabel="Guardando..." />
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-rs-950 text-white">Cargando...</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
