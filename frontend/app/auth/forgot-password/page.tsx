"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../../../services/users";
import Toast from "../../../components/Toast";

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
    } catch (err) {
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
    <div className="min-h-screen flex items-center justify-center bg-[#050214] font-sans">
      <div className="w-full max-w-md bg-[#181828] p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold text-white mb-2">
          Recuperar contraseña
        </h2>
        <p className="text-zinc-300 mb-6 text-sm">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu
          contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-zinc-300 mb-1">
              Email
            </label>
            <div className="flex items-center border-b border-zinc-400 py-2">
              <span className="mr-2 text-zinc-400">📧</span>
              <input
                type="email"
                id="email"
                required
                className="bg-transparent outline-none text-white w-full"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-full bg-[#5C54E7] text-white font-semibold text-lg transition duration-200 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
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
