"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "../../services/users";
import Toast from "../../components/Toast";

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
    } catch (err) {
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
    <div className="min-h-screen flex items-center justify-center bg-[#050214] font-sans">
      <div className="w-full max-w-md bg-[#181828] p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-white mb-2">
          Nueva contraseña
        </h2>
        <p className="text-zinc-300 mb-6 text-sm">
          Define una nueva contraseña para tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-zinc-300 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              required
              minLength={6}
              className="w-full bg-transparent border-b border-zinc-400 py-2 text-white outline-none"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-zinc-300 mb-1"
            >
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              required
              minLength={6}
              className="w-full bg-transparent border-b border-zinc-400 py-2 text-white outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-full bg-[#5C54E7] text-white font-semibold text-lg transition duration-200 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>

        <p className="mt-6 text-center text-zinc-300 text-sm">
          <Link href="/auth/login" className="text-[#6356E5] font-semibold">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050214] text-white">
          Cargando...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
